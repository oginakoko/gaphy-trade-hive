
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "../shared/ImageUploader";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { Calendar } from "../ui/calendar";

const adFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  content: z.string().min(10, "Content must be at least 10 characters").max(500),
  link_url: z.string().url("Must be a valid URL"),
  image_url: z.string().url().nullable(),
  start_date: z.date({ required_error: "A start date is required." }),
  end_date: z.date({ required_error: "An end date is required." }),
}).refine(data => data.end_date > data.start_date, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type AdFormValues = z.infer<typeof adFormSchema>;

const AD_COST_PER_DAY = 10;

export const AdForm = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const form = useForm<AdFormValues>({
        resolver: zodResolver(adFormSchema),
        defaultValues: {
            title: "",
            content: "",
            link_url: "",
            image_url: null,
            start_date: undefined,
            end_date: undefined,
        },
    });

    const { watch } = form;
    const startDate = watch("start_date");
    const endDate = watch("end_date");

    const calculateCost = () => {
        if (startDate && endDate && endDate >= startDate) {
            const days = differenceInDays(endDate, startDate) + 1;
            return days * AD_COST_PER_DAY;
        }
        return 0;
    };
    
    const totalCost = calculateCost();

    const createAdMutation = useMutation({
        mutationFn: async (values: AdFormValues) => {
            if (!user) throw new Error("You must be logged in to create an ad.");
            
            if(totalCost <= 0) throw new Error("Invalid date range selected.");

            const { data, error } = await supabase.from('ads').insert({
                ...values,
                user_id: user.id,
                cost: totalCost,
                status: 'pending_payment', // Ad is created and awaits payment
            }).select();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({ title: "Ad Submitted!", description: "Your ad is now pending payment." });
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            navigate('/');
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    function onSubmit(data: AdFormValues) {
        // We will add payment logic here later.
        createAdMutation.mutate(data);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ad Image</FormLabel>
                            <FormControl>
                                <ImageUploader
                                    value={field.value || undefined}
                                    onChange={field.onChange}
                                    bucketName="ad_images"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ad Title</FormLabel>
                            <FormControl>
                                <Input placeholder="My Awesome Product" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ad Content</FormLabel>
                            <FormControl>
                                <Textarea placeholder="A brief description of what you're advertising." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="link_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Link URL</FormLabel>
                            <FormControl>
                                <Input type="url" placeholder="https://example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Campaign Start Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a start date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Campaign End Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick an end date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < (startDate || new Date(new Date().setHours(0,0,0,0)))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {totalCost > 0 && startDate && endDate && (
                    <div className="p-4 bg-brand-gray-200/50 rounded-lg text-center space-y-1 animate-fade-in">
                        <FormDescription>Total Cost</FormDescription>
                        <p className="text-3xl font-bold text-white">${totalCost.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">
                            {differenceInDays(endDate, startDate) + 1} day{differenceInDays(endDate, startDate) + 1 > 1 ? 's' : ''} at ${AD_COST_PER_DAY}/day
                        </p>
                    </div>
                )}


                <Button type="submit" disabled={createAdMutation.isPending || totalCost <= 0} className="w-full">
                    {createAdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Ad
                </Button>
            </form>
        </Form>
    );
};
