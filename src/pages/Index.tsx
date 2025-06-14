
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart, Users, BookOpen } from 'lucide-react';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="glass-card rounded-xl p-6 text-center flex flex-col items-center animate-fade-in-up">
    <div className="bg-brand-green/10 p-4 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);


const Index = () => {
  return (
    <>
      <Header />
      <main className="py-16 md:py-24">
        <section className="text-center animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
            Unlock Pro-Level Trading Insights with <span className="text-brand-green">GaphyHive</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-300">
            Join a thriving community of traders. Get access to detailed technical analysis, actionable trade ideas, and engage with fellow enthusiasts.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-brand-green text-black font-bold hover:bg-brand-green/80">
              <Link to="/analysis">View Analysis</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-brand-green text-brand-green hover:bg-brand-green/10 hover:text-brand-green">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </section>

        <section className="mt-20 md:mt-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BarChart className="h-8 w-8 text-brand-green" />} 
              title="Expert Analysis"
              description="In-depth technical breakdowns and clear trade ideas from experienced analysts."
            />
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-brand-green" />} 
              title="Community Driven"
              description="React, comment, and discuss trade ideas with a vibrant community of traders."
            />
            <FeatureCard 
              icon={<BookOpen className="h-8 w-8 text-brand-green" />} 
              title="Educational Content"
              description="Learn from detailed explanations and improve your own trading strategies."
            />
          </div>
        </section>

        <footer className="text-center mt-20 md:mt-32 text-gray-500">
          <p>&copy; {new Date().getFullYear()} GaphyHive. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
};

export default Index;
