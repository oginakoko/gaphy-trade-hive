import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Brain, Users, GraduationCap, TrendingUp, BarChart3, Zap, Shield, Globe } from 'lucide-react'
import './App.css'

// Import images
import heroBackground from './assets/images/hero-background.png'
import aiBrainIcon from './assets/images/ai-brain-icon.png'
import communityIcon from './assets/images/community-icon.png'
import educationIcon from './assets/images/education-icon.png'
import tradingDashboard1 from './assets/images/trading-dashboard-1.jpg'
import tradingDashboard2 from './assets/images/trading-dashboard-2.jpg'

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2 }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])
  
  return <span>{count.toLocaleString()}</span>
}

// Floating Particles Component
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-1 h-1 bg-primary rounded-full opacity-60"
      initial={{ 
        x: Math.random() * window.innerWidth, 
        y: Math.random() * window.innerHeight 
      }}
      animate={{
        y: [0, -100, 0],
        x: [0, Math.random() * 100 - 50, 0],
        opacity: [0.6, 1, 0.6]
      }}
      transition={{
        duration: Math.random() * 10 + 10,
        repeat: Infinity,
        ease: "linear"
      }}
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`
      }}
    />
  ))
  
  return <div className="particles">{particles}</div>
}

// Navigation Component
const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass backdrop-blur-md' : ''
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="text-2xl font-bold gradient-text"
            whileHover={{ scale: 1.05 }}
          >
            GaphyHive
          </motion.div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How It Works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a>
          </div>
          
          <Button className="btn-primary text-primary-foreground">
            Get Started
          </Button>
        </div>
      </div>
    </motion.nav>
  )
}

// Hero Section Component
const HeroSection = () => {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y }}
      >
        <img 
          src={heroBackground} 
          alt="Hero Background" 
          className="w-full h-full object-cover opacity-50"
        />
      </motion.div>
      
      <FloatingParticles />
      
      <div className="container mx-auto px-6 text-center z-10">
        <motion.h1 
          className="text-5xl md:text-7xl font-bold mb-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          Your AI-Powered{' '}
          <span className="gradient-text">Trading Intelligence</span>{' '}
          Platform
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          Advanced market analysis, community insights, and AI-driven trade recommendations 
          in one powerful platform. Join thousands of successful traders.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <Button size="lg" className="btn-primary text-primary-foreground px-8 py-4 text-lg">
            Start Trading Smarter
          </Button>
          <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Watch Demo
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

// Trust Indicators Component
const TrustIndicators = () => {
  return (
    <section className="py-16 border-b border-border">
      <div className="container mx-auto px-6">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">
              <AnimatedCounter end={25000} />+
            </div>
            <div className="text-muted-foreground">Active Traders</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-secondary">
              <AnimatedCounter end={1200000} />+
            </div>
            <div className="text-muted-foreground">Trades Analyzed</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-accent">
              <AnimatedCounter end={89} />%
            </div>
            <div className="text-muted-foreground">Success Rate</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold gradient-text">
              $<AnimatedCounter end={50} />M+
            </div>
            <div className="text-muted-foreground">Volume Traded</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Features Section Component
const FeaturesSection = () => {
  const features = [
    {
      icon: aiBrainIcon,
      title: "Advanced AI Analysis",
      description: "Get instant market insights powered by machine learning algorithms that analyze thousands of data points in real-time.",
      color: "text-primary"
    },
    {
      icon: communityIcon,
      title: "Community-Driven Insights",
      description: "Connect with expert traders, share strategies, and learn from a vibrant community of successful investors.",
      color: "text-secondary"
    },
    {
      icon: educationIcon,
      title: "Learn & Grow",
      description: "Access comprehensive trading courses, market analysis tutorials, and expert-led webinars.",
      color: "text-accent"
    }
  ]
  
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="gradient-text">GaphyHive</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the powerful features that make GaphyHive the ultimate trading platform
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="feature-card glass border-border h-full">
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <img 
                      src={feature.icon} 
                      alt={feature.title}
                      className="w-16 h-16 mx-auto animate-pulse-glow"
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// How It Works Section Component
const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Sign Up & Connect",
      description: "Create your account and connect your preferred trading platform or broker for seamless integration.",
      icon: <Shield className="w-8 h-8" />
    },
    {
      number: "02", 
      title: "Analyze Markets",
      description: "Our AI scans thousands of market indicators and provides you with actionable insights and trade recommendations.",
      icon: <BarChart3 className="w-8 h-8" />
    },
    {
      number: "03",
      title: "Execute & Learn",
      description: "Execute trades with confidence and learn from our community of expert traders and educational resources.",
      icon: <TrendingUp className="w-8 h-8" />
    }
  ]
  
  return (
    <section id="how-it-works" className="py-20 bg-card/20">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get Started in <span className="gradient-text">3 Easy Steps</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of successful traders in just a few simple steps
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="glass border-border p-8 text-center relative overflow-hidden">
                <div className="absolute top-4 right-4 text-6xl font-bold text-primary/10">
                  {step.number}
                </div>
                <div className="text-primary mb-4 flex justify-center">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </Card>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Testimonials Section Component
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Day Trader",
      content: "GaphyHive's AI analysis has completely transformed my trading strategy. I've seen a 40% improvement in my success rate.",
      avatar: "SC"
    },
    {
      name: "Marcus Rodriguez", 
      role: "Portfolio Manager",
      content: "The community insights are invaluable. Learning from other successful traders has accelerated my growth tremendously.",
      avatar: "MR"
    },
    {
      name: "Emily Watson",
      role: "Swing Trader", 
      content: "The educational content is top-notch. I went from beginner to profitable trader in just 6 months.",
      avatar: "EW"
    }
  ]
  
  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What Our <span className="gradient-text">Traders Say</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of successful traders who trust GaphyHive
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="glass border-border p-8 h-full">
                <CardContent className="p-0">
                  <p className="text-muted-foreground mb-6 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-bold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section Component
const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
      <div className="container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your <span className="gradient-text">Trading</span>?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of successful traders using AI-powered insights to maximize their profits
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="btn-primary text-primary-foreground px-8 py-4 text-lg animate-glow">
              Start Your Free Trial
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
              Schedule a Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Footer Component
const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold gradient-text mb-4">GaphyHive</div>
            <p className="text-muted-foreground">
              AI-powered trading intelligence platform for modern traders.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 GaphyHive. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// Main App Component
function App() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <TrustIndicators />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}

export default App

