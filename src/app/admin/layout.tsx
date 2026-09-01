'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Vote, 
  Settings, 
  LogOut, 
  Image as ImageIcon,
  Menu,
  X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
        return;
      }
      
      if (session && pathname !== '/admin/login') {
        // Verify admin role
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (!adminData) {
          await supabase.auth.signOut();
          router.push('/admin/login');
          return;
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [pathname, router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (loading) return <div className="min-h-screen gradient-bg flex items-center justify-center"><div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Categories', href: '/admin/categories', icon: Trophy },
    { name: 'Nominations', href: '/admin/nominations', icon: Users },
    { name: 'Nominees', href: '/admin/nominees', icon: Users },
    { name: 'Votes', href: '/admin/votes', icon: Vote },
    { name: 'Flyer Generator', href: '/admin/flyers', icon: ImageIcon },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-dark-100 flex">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-dark-800 rounded-lg text-gold-400 border border-gold-500/20">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 h-screen w-64 bg-dark-900 border-r border-dark-800 flex flex-col transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-dark-800">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-gold-400 to-gold-600">
              <Trophy className="w-4 h-4 text-dark-950" />
            </div>
            <span className="font-display font-bold text-lg gold-text">Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' 
                    : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-gold-400' : 'text-dark-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="h-16 border-b border-dark-800 bg-dark-900/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="md:hidden"></div> {/* Spacer for mobile menu button */}
          <div className="flex items-center gap-4 ml-auto">
            <a href="/" target="_blank" className="text-sm text-dark-400 hover:text-gold-400 transition-colors">
              View Live Site ↗
            </a>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 relative">
          <div className="absolute top-0 left-0 w-full h-64 bg-gold-500/5 opacity-50 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }} />
          <div className="max-w-6xl mx-auto relative z-10">
            {children}
          </div>
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
