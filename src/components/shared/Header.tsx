import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(234, 179, 8, 0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)' }}>
              <Trophy className="w-5 h-5 text-dark-950" />
            </div>
            <span className="font-display text-lg font-bold gold-text hidden sm:block">
              Awards Night
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/nominate"
              className="px-3 py-2 text-sm font-medium text-dark-300 hover:text-gold-400 transition-colors rounded-lg hover:bg-white/5"
            >
              Nominate
            </Link>
            <Link
              href="/vote"
              className="px-3 py-2 text-sm font-medium text-dark-300 hover:text-gold-400 transition-colors rounded-lg hover:bg-white/5"
            >
              Vote
            </Link>

            <Link
              href="/nominee-portal"
              className="gold-btn-outline !py-2 !px-4 !text-xs"
            >
              Nominee Portal
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
