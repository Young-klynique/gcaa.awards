import { Trophy, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-dark-800/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)' }}>
                <Trophy className="w-4 h-4 text-dark-950" />
              </div>
              <span className="font-display text-lg font-bold gold-text">Awards Night</span>
            </div>
            <p className="text-dark-400 text-sm leading-relaxed">
              Celebrating excellence and honoring outstanding individuals at our prestigious Awards & Movie Day.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-3">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { label: 'Nominate', href: '/nominate' },
                { label: 'Vote', href: '/vote' },
                { label: 'Nominee Portal', href: '/nominee-portal' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-dark-400 hover:text-gold-400 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-3">Information</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              For inquiries and support, please contact the organizing committee.
            </p>
            <p className="text-dark-500 text-xs mt-4">
              Payments securely processed by Paystack
            </p>
          </div>
        </div>

        <div className="border-t border-dark-800/50 mt-8 pt-6 text-center">
          <p className="text-dark-500 text-xs flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for Awards & Movie Day 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
