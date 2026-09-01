import Link from 'next/link';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { Trophy, Vote, Users, ArrowRight, Sparkles, Award, Clock, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header />
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span className="text-gold-400 text-sm font-medium">2026 Edition</span>
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <span className="text-dark-100">Awards &</span><br />
            <span className="gold-text">Dinner Night</span>
          </h1>
          <p className="text-dark-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Celebrating excellence and honoring outstanding individuals who have made a remarkable impact.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/nominate" className="gold-btn flex items-center gap-2 text-base">
              <Users className="w-5 h-5" /> Nominate Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/vote" className="gold-btn-outline flex items-center gap-2 text-base">
              <Vote className="w-5 h-5" /> Vote Now
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-14 text-center"><span className="gold-text">How It Works</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Users, step: '01', title: 'Nominate', desc: 'Submit nominations for deserving individuals across various award categories.' },
              { icon: Vote, step: '02', title: 'Vote', desc: 'Cast your votes for nominees. Each vote costs GH₵ 1.00 via secure payment.' },
              { icon: Trophy, step: '03', title: 'Celebrate', desc: 'Join us at the grand Awards & Dinner Night to witness the winners crowned.' },
            ].map((item) => (
              <div key={item.step} className="glass-card p-8 relative group hover:border-gold-500/30 transition-all duration-500">
                <div className="absolute -top-3 -right-3 w-12 h-12 rounded-xl flex items-center justify-center font-display text-2xl font-bold gold-text" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.15)' }}>{item.step}</div>
                <item.icon className="w-10 h-10 text-gold-400 mb-5" />
                <h3 className="font-display text-xl font-bold text-dark-100 mb-3">{item.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: Clock, title: 'Live Countdown', desc: 'Real-time countdown timers for nomination and voting periods.' },
            { icon: Star, title: 'Real-Time Results', desc: 'Nominees track votes in real-time through a secure private portal.' },
            { icon: Award, title: 'Multiple Categories', desc: 'Various award categories to recognize excellence in different areas.' },
            { icon: Sparkles, title: 'Secure Payments', desc: 'Vote payments securely processed through Paystack. Supports MoMo & cards.' },
          ].map((f) => (
            <div key={f.title} className="glass-card p-8 flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.15)' }}>
                <f.icon className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-dark-100 mb-2">{f.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-10 sm:p-14" style={{ borderColor: 'rgba(234,179,8,0.2)' }}>
            <Trophy className="w-14 h-14 text-gold-400 mx-auto mb-6" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4"><span className="gold-text">Ready to Participate?</span></h2>
            <p className="text-dark-400 mb-8 max-w-lg mx-auto">Now is the time to nominate a deserving individual or cast your vote.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/nominate" className="gold-btn flex items-center gap-2">Nominate <ArrowRight className="w-4 h-4" /></Link>
              <Link href="/vote" className="gold-btn-outline flex items-center gap-2">Cast Your Vote</Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
