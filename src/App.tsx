import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import ManageTradeIdeas from "./pages/admin/ManageTradeIdeas";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layout/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import TradeIdeaPage from "./pages/TradeIdeaPage";
import ProfilePage from "./pages/Profile";
import CreateAd from "./pages/CreateAd";
import ManageAds from "./pages/admin/ManageAds";
import DonationsLog from "./pages/admin/DonationsLog";
import ManageAffiliateLinks from "./pages/admin/ManageAffiliateLinks";
import ManageUsers from "./pages/admin/ManageUsers";
import Analysis from "./pages/Analysis";
import AuthGuard from "./components/auth/AuthGuard";
import GuestGuard from "./components/auth/GuestGuard";
import ManageApiKeys from "./pages/admin/ManageApiKeys";
import Servers from "./pages/Servers";
import ShortlinkRedirect from "./pages/ShortlinkRedirect";
import CreateTradeIdea from "./pages/CreateTradeIdea";
import Support from "./pages/Support";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MainLayout>
            <Routes>
              <Route element={<GuestGuard />}>
                <Route path="/" element={<Index />} />
              </Route>
              <Route path="/auth" element={<Auth />} />
              <Route path="/trade-ideas/:id" element={<TradeIdeaPage />} />

              {/* Routes for authenticated (non-admin) users */}
              <Route element={<AuthGuard />}>
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/servers" element={<Servers />} />
                <Route path="/servers/:serverId" element={<Servers />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/create-ad" element={<CreateAd />} />
                <Route path="/support" element={<Support />} />
              </Route>

              {/* Admin-only routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/trade-ideas" element={<ManageTradeIdeas />} />
                <Route path="/admin/ads" element={<ManageAds />} />
                <Route path="/admin/donations" element={<DonationsLog />} />
                <Route path="/admin/affiliate-links" element={<ManageAffiliateLinks />} />
                <Route path="/admin/users" element={<ManageUsers />} />
                <Route path="/admin/api-keys" element={<ManageApiKeys />} />
                <Route path="/create-trade-idea" element={<CreateTradeIdea />} />
              </Route>
              
              {/* Redirect route for shortlinks */}
              <Route path="/s/:code" element={<ShortlinkRedirect />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
