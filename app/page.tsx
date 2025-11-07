"use client"

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Trophy, BarChart3, Wallet, Coins, CreditCard, DollarSign, HelpCircle, Banknote, ChevronRight } from "lucide-react"

// Create a separate component for falling elements
const FallingElements = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true after component mounts to trigger animations
    setIsMounted(true);
  }, []);

  const icons = [
    <DollarSign key="dollar" className="w-6 h-6 md:w-8 md:h-8 text-green-400" />,
    <Coins key="coins" className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />,
    <HelpCircle key="help" className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />,
    <Banknote key="banknote" className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />,
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(15)].map((_, i) => {
        const delay = Math.random() * 5;
        const duration = 8 + Math.random() * 4;
        const startX = Math.random() * 100;
        const opacity = 0.2 + Math.random() * 0.3;
        
        return (
          <div
            key={i}
            className={`absolute transition-opacity duration-1000 ${isMounted ? 'opacity-100' : 'opacity-0'}`}
            style={{
              left: `${startX}%`,
              top: '-50px',
              animation: `fall ${duration}s linear ${delay}s infinite`,
              opacity: opacity,
            }}
          >
            {icons[i % icons.length]}
          </div>
        );
      })}

      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 rounded-xl border border-slate-700 backdrop-blur-sm hover:border-primary/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group text-center">
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-white font-bold mb-4 text-xl group-hover:text-primary transition-colors">{title}</h3>
    <p className="text-slate-300 leading-relaxed">{desc}</p>
  </div>
);

// Reward Card Component
const RewardCard = ({ icon, title, desc }) => (
  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 rounded-xl border border-slate-700 backdrop-blur-sm hover:border-accent/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden text-center">
    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10">
      {icon}
    </div>
    <h3 className="text-white font-bold mb-4 text-xl group-hover:text-accent transition-colors relative z-10">{title}</h3>
    <p className="text-slate-300 leading-relaxed relative z-10">{desc}</p>
  </div>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <FallingElements />

      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                PH Trivia
              </h1>
            </Link>
            <div className="flex gap-2 sm:gap-3">
              <Link href="/player/login">
                <Button variant="ghost" className="text-white hover:bg-slate-800/50">
                  Login
                </Button>
              </Link>
              <Link href="/player/sign-up">
                <Button className="bg-primary hover:bg-primary/90 text-white px-6">
                  Sign Up <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center space-y-10">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Test Your Knowledge of the{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Philippines
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Dive into engaging trivia games about Philippine history, culture, and landmarks. Earn points with every correct answer and redeem them for real cash rewards via GCash, PayPal, or cryptocurrency. Fun meets fortune—start today!
            </p>
          </div>

          <div className="flex justify-center">
            <Link href="/player/sign-up">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold px-10 h-14 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                Start Playing Now
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">Why Play PH Trivia?</h2>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Discover a world of exciting features designed to make learning about the Philippines both entertaining and rewarding. Join the fun and flex your knowledge!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            <FeatureCard
              icon={<BookOpen className="w-10 h-10 text-primary" />}
              title="Categories"
              desc="Play quizzes on history, culture, geography, and more."
            />
            <FeatureCard
              icon={<Trophy className="w-10 h-10 text-accent" />}
              title="Earn Rewards"
              desc="Get points for right answers and redeem for cash."
            />
            <FeatureCard
              icon={<BarChart3 className="w-10 h-10 text-primary" />}
              title="Track Progress"
              desc="See your stats and unlock badges."
            />
          </div>
        </section>

        {/* Rewards Section */}
        <section className="bg-gradient-to-b from-slate-900/50 to-blue-900/20 py-32 md:py-40 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,theme(colors.primary/5)_0%,transparent_50%)] opacity-50" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Exchange Points for{" "}
                <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  Real Cash Rewards
                </span>
              </h2>
              <p className="text-lg md:text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
                Your knowledge is valuable—convert every point you earn into tangible rewards. Choose from convenient payout options and withdraw as soon as you hit the minimum threshold. No hassle, just rewards!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              <RewardCard
                icon={<Wallet className="w-10 h-10 text-accent" />}
                title="GCash"
                desc="Fast transfers to your GCash wallet."
              />
              <RewardCard
                icon={<CreditCard className="w-10 h-10 text-primary" />}
                title="PayPal"
                desc="Send money worldwide via PayPal."
              />
              <RewardCard
                icon={<Coins className="w-10 h-10 text-yellow-400" />}
                title="Crypto"
                desc="Get paid in USDT, BTC, or ETH."
              />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl border border-slate-700 p-10 sm:p-16 md:p-20 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">Ready to Play and Earn?</h2>
            <p className="text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed text-lg">
              Join other Filipinos to earn cash from trivia. It's free and easy.
            </p>
            <Link href="/player/sign-up">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-semibold px-10 h-14 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started Free <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.2; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </main>
  )
}
