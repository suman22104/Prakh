import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  Activity,
  HandHeart,
  Home,
  LayoutDashboard,
  Menu,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  WifiOff,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export { LanguageProvider, useLanguage };

interface NavItem {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline } = useApp();
  const { t } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    { to: '/', label: t.nav.home, Icon: Home },
    { to: '/check', label: t.nav.check, Icon: ShieldAlert },
    { to: '/assisted', label: t.nav.assisted, Icon: HandHeart },
    { to: '/dashboard', label: t.nav.dashboard, Icon: LayoutDashboard },
    { to: '/reviewer', label: t.nav.reviewer, Icon: UserCheck },
    { to: '/status', label: t.nav.status, Icon: Activity },
  ];

  const mobileTabs: NavItem[] = [
    { to: '/', label: t.nav.home, Icon: Home },
    { to: '/check', label: t.nav.check, Icon: ShieldAlert },
    { to: '/assisted', label: t.nav.assisted, Icon: HandHeart },
    { to: '/dashboard', label: t.nav.dashboard, Icon: LayoutDashboard },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const currentSectionLabel = (() => {
    if (location.pathname.startsWith('/result/')) return t.nav.check;
    const matched = navItems.find((item) => isActive(item.to));
    return matched ? matched.label : t.nav.home;
  })();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${t.brandName} — ${t.brandTagline}`;
  }, [t.brandName, t.brandTagline]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const renderSidebarLinks = (onNavigate?: () => void) => (
    <nav aria-label="Primary navigation" className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
      {navItems.map(({ to, label, Icon }) => {
        const active = isActive(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E79D78] ${
              active
                ? 'bg-[#C84620] text-white font-semibold'
                : 'text-[#D6CFC0] font-medium hover:bg-white/10 hover:text-[#FFFDF8]'
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#A6B5AE]'}`}
              aria-hidden={true}
            />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const renderSidebarFooter = () => (
    <div className="p-4 border-t border-white/12 text-xs text-[#C7C1B2] space-y-2">
      <div className="flex items-center gap-2 text-[#FFFDF8] font-semibold">
        <PhoneCall className="w-3.5 h-3.5 text-[#F2A07B] shrink-0" aria-hidden={true} />
        <span>National Cyber Helpline</span>
      </div>
      <p className="leading-relaxed">
        Dial{' '}
        <span className="font-mono font-semibold text-[#FFFDF8] tabular-nums">1930</span>
        {' · '}
        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#F5B495] hover:text-white underline underline-offset-2"
        >
          cybercrime.gov.in
        </a>
      </p>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex bg-[#F7F3EA] text-[#132A23]">
        {/* Desktop Persistent Deep Forest-Ink Navigation Sidebar (256px) */}
        <aside
          aria-label="Sidebar navigation"
          className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-[#132A23] text-[#F7F3EA] border-r border-[#0D1E19] z-30"
        >
          <div className="min-h-16 px-5 py-3.5 border-b border-white/12 flex items-center shrink-0">
            <Link
              to="/"
              aria-label={`${t.brandName} — ${t.brandTagline}`}
              className="inline-flex items-center gap-3 text-sm font-bold leading-snug tracking-tight text-[#FFFDF8] min-w-0"
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#C84620] text-white shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden={true} />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="font-display text-lg font-bold leading-none text-[#FFFDF8] truncate">
                  {t.brandName}
                </span>
                <span className="text-[11px] font-medium text-[#C7C1B2] leading-snug mt-1 truncate">
                  {t.brandTagline}
                </span>
              </span>
            </Link>
          </div>

          {renderSidebarLinks()}
          {renderSidebarFooter()}
        </aside>

        {/* Mobile & Tablet Responsive Slide-Over Sidebar Drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 flex"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              id="mobile-sidebar-drawer"
            >
              <motion.button
                type="button"
                aria-label="Close navigation backdrop"
                onClick={() => setSidebarOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="fixed inset-0 bg-[#132A23]/55 backdrop-blur-[1px]"
              />
              <motion.aside
                initial={{ x: -280, opacity: 0.9 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0.9 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-72 max-w-[84vw] h-full bg-[#132A23] text-[#F7F3EA] border-r border-[#0D1E19] flex flex-col shadow-2xl"
              >
                <div className="min-h-14 px-4 py-2.5 border-b border-white/12 flex items-center justify-between gap-2 shrink-0">
                  <Link
                    to="/"
                    onClick={() => setSidebarOpen(false)}
                    className="inline-flex items-center gap-2.5 text-sm font-bold leading-snug tracking-tight text-[#FFFDF8] min-w-0"
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#C84620] text-white shrink-0">
                      <ShieldCheck className="w-4 h-4" aria-hidden={true} />
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="font-display text-base font-bold leading-none text-[#FFFDF8] truncate">
                        {t.brandName}
                      </span>
                      <span className="text-[11px] font-medium text-[#C7C1B2] leading-snug mt-0.5 truncate">
                        {t.brandTagline}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation menu"
                    className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#D6CFC0] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E79D78] shrink-0"
                  >
                    <X className="w-5 h-5" aria-hidden={true} />
                  </button>
                </div>

                {renderSidebarLinks(() => setSidebarOpen(false))}
                {renderSidebarFooter()}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Shell (offset by 256px sidebar on desktop) */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Sticky Warm Khadi Top Bar (56px mobile to stay well within 15% sticky cap) */}
          <header className="sticky top-0 z-20 bg-[#F7F3EA]/95 backdrop-blur-sm border-b border-[#DDD5C5]">
            <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-6">
              {/* Left Zone: Mobile Sidebar Toggle + Contextual Section Title */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  aria-expanded={sidebarOpen}
                  aria-controls="mobile-sidebar-drawer"
                  className="lg:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-[#D4CBB8] bg-[#FFFDF8] text-[#132A23] hover:bg-[#EFE9DC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C84620] shrink-0"
                >
                  <Menu className="w-5 h-5" aria-hidden={true} />
                </button>

                <Link
                  to="/"
                  aria-label={`${t.brandShort} — ${t.brandTagline}`}
                  className="lg:hidden inline-flex items-center gap-1.5 text-base font-bold tracking-tight text-[#132A23] whitespace-nowrap min-w-0"
                >
                  <span className="truncate font-display">{t.brandShort}</span>
                </Link>

                <div className="hidden lg:flex items-center gap-2 text-sm min-w-0">
                  <span className="text-[#6B655D] whitespace-nowrap">{t.brandName}</span>
                  <span className="text-[#C6BDAB]" aria-hidden={true}>
                    /
                  </span>
                  <span className="font-semibold text-[#132A23] truncate">{currentSectionLabel}</span>
                </div>
              </div>

              {/* Right Zone: Language Selector + Primary Action */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <LanguageSelector size="compact" />
                <Link
                  to="/check"
                  className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-lg bg-[#C84620] text-white text-xs sm:text-sm font-semibold hover:bg-[#AD3A18] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#132A23]"
                >
                  {t.nav.checkNow}
                </Link>
              </div>
            </div>
          </header>

          {/* Real connectivity banner shown only when offline */}
          {!isOnline && (
            <div
              role="status"
              className="bg-[#FDF6E3] border-b border-[#E5C98B] text-[#78350F] px-4 py-2 text-xs sm:text-sm"
            >
              <div className="max-w-6xl mx-auto flex items-center gap-2 font-medium">
                <WifiOff className="w-4 h-4 shrink-0 text-[#B45309]" aria-hidden={true} />
                <span>{t.common.offlineBanner}</span>
              </div>
            </div>
          )}

          {/* Main Viewport */}
          <main className="flex-1 min-w-0 pb-20 md:pb-12">{children}</main>

          {/* Quiet Editorial Civic Footer */}
          <footer className="border-t border-[#DDD5C5] bg-[#EFE9DC]/60 pb-20 md:pb-8 pt-7">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#57534E]">
              <div className="space-y-1">
                <p className="font-semibold text-[#132A23]">
                  {t.brandName} — <span className="font-normal text-[#57534E]">{t.brandTagline}</span>
                </p>
                <p>
                  Advisory digital payment safety tool · National Cybercrime Helpline:{' '}
                  <span className="font-mono font-semibold text-[#132A23] tabular-nums">1930</span> ·
                  Portal:{' '}
                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C84620] font-medium hover:underline"
                  >
                    cybercrime.gov.in
                  </a>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <Link to="/status" className="min-h-[36px] hover:text-[#132A23] inline-flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" aria-hidden={true} />
                  {t.nav.status}
                </Link>
                <Link to="/reviewer" className="min-h-[36px] inline-flex items-center hover:text-[#132A23]">
                  {t.nav.reviewer}
                </Link>
                <Link to="/dashboard" className="min-h-[36px] inline-flex items-center hover:text-[#132A23]">
                  {t.nav.dashboard}
                </Link>
              </div>
            </div>
          </footer>
        </div>

        {/* Mobile Bottom Thumb Navigation (56px height) */}
        <nav
          aria-label="Mobile navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FFFDF8]/95 backdrop-blur-md border-t border-[#DDD5C5]"
        >
          <div className="grid grid-cols-4 h-14">
            {mobileTabs.map(({ to, label, Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[11px] transition-colors ${
                    active ? 'text-[#C84620] font-bold' : 'text-[#57534E] font-medium'
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full bg-[#C84620]"
                    />
                  )}
                  <Icon className="w-5 h-5" aria-hidden={true} />
                  <span className="truncate max-w-[82px] px-1">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </MotionConfig>
  );
};
