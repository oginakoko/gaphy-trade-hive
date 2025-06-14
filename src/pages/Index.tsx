
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart, Users, BookOpen, ArrowRight } from 'lucide-react';

const FeatureCard = ({ icon, title, description, index }: { icon: React.ReactNode, title: string, description: string, index: number }) => (
  <div 
    className="glass-card rounded-xl p-6 text-center flex flex-col items-center transform transition-transform duration-300 hover:-translate-y-2 animate-fade-in-up"
    style={{ animationDelay: `${index * 150}ms` }}
  >
    <div className="bg-brand-green/10 p-4 rounded-full mb-4 ring-1 ring-brand-green/20">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green font-bold text-xl flex items-center justify-center">
      {number}
    </div>
    <div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-gray-400 mt-1">{description}</p>
    </div>
  </div>
);


const Index = () => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(0,255,163,0.1)_0,_rgba(0,255,163,0)_50%)] -z-10" />

      <Header />
      <main className="py-16 md:py-24">
        <section className="text-center animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Professional Grade<br/> Trading Analysis
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300">
            Dive into deep technical analysis, discover actionable trade ideas, and collaborate with a community of expert traders on GaphyHive.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-brand-green text-black font-bold hover:bg-brand-green/80 shadow-lg shadow-brand-green/30 transition-all duration-300 transform hover:scale-105">
              <Link to="/analysis">Explore Analysis <ArrowRight className="ml-2" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10 hover:text-white backdrop-blur-sm">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </section>

        <section className="mt-24 md:mt-32">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 animate-fade-in-up" style={{animationDelay: '150ms'}}>Why GaphyHive?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              index={1}
              icon={<BarChart className="h-8 w-8 text-brand-green" />} 
              title="Expert Analysis"
              description="In-depth technical breakdowns and clear trade ideas from experienced analysts."
            />
            <FeatureCard 
              index={2}
              icon={<Users className="h-8 w-8 text-brand-green" />} 
              title="Community Driven"
              description="React, comment, and discuss trade ideas with a vibrant community of traders."
            />
            <FeatureCard 
              index={3}
              icon={<BookOpen className="h-8 w-8 text-brand-green" />} 
              title="Educational Content"
              description="Learn from detailed explanations and improve your own trading strategies."
            />
          </div>
        </section>

        <section className="mt-24 md:mt-32 animate-fade-in-up" style={{animationDelay: '300ms'}}>
           <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">Get Started in 3 Easy Steps</h2>
           <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-1 gap-12">
             <StepCard 
              number="1"
              title="Create an Account"
              description="Sign up for free to unlock full access to our analysis and community features."
            />
             <StepCard 
              number="2"
              title="Explore Trade Ideas"
              description="Browse through detailed analyses from our experts, complete with charts and strategies."
            />
             <StepCard 
              number="3"
              title="Join the Discussion"
              description="Engage with the community by liking, commenting, and sharing your own insights on trade ideas."
            />
           </div>
        </section>

        <section className="mt-24 md:mt-32 text-center animate-fade-in-up" style={{animationDelay: '450ms'}}>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Ready to Elevate Your Trading?</h2>
          <p className="mt-4 max-w-xl mx-auto text-lg text-gray-400">Join GaphyHive today and gain the edge you need in the markets.</p>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-brand-green text-black font-bold hover:bg-brand-green/80 shadow-lg shadow-brand-green/30 transition-all duration-300 transform hover:scale-105">
              <Link to="/auth">Sign Up Now <ArrowRight className="ml-2" /></Link>
            </Button>
          </div>
        </section>


        <footer className="text-center mt-20 md:mt-32 text-gray-500">
          <p>&copy; {new Date().getFullYear()} GaphyHive. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
