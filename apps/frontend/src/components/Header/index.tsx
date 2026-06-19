'use client';

import Link from 'next/link';
import { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogIn, LogOut, Menu, X, Stethoscope, Shield, Home } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthProvider';
import { ThemeToggle } from '../ThemeToggle';

type ActionOptions = {
  fullWidth?: boolean;
  onAction?: () => void;
};

const navLinks = [
  { label: 'Início', href: '/' },
  { label: 'Profissionais', href: '/medicos' },
  { label: 'Privacidade', href: '/privacidade' },
];

const navIcons = [Home, Stethoscope, Shield];

export function Header() {
  const { isAuthenticated, user, signOut } = useContext(AuthContext);
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const hideButtonOnRoutes = ['/validar', '/receitas/validar', '/recuperar-senha', '/redefinir-senha', '/cadastro'];
  const shouldHideActions = hideButtonOnRoutes.some((route) => pathname.startsWith(route));
  const isValidationRoute = pathname.startsWith('/validar') || pathname.startsWith('/receitas/validar');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getLogoHref = () => {
    if (!isAuthenticated || !user) return '/';
    if (user.role === 'PATIENT') return '/paciente/dashboard';
    if (user.role === 'DOCTOR') return '/medico/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/';
  };

  const baseActionClasses =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-sm';

  const headerClass = isLandingPage
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-sm py-2' : 'bg-gradient-to-b from-slate-900/80 to-transparent border-transparent py-4'}`
    : `sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-2`;

  const forceDarkText = isLandingPage && !scrolled;

  const logoColor = forceDarkText ? 'text-white' : 'text-slate-900 dark:text-white';
  const navLinkClass = forceDarkText ? 'text-white/90 hover:text-white' : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400';
  const menuButtonClass = forceDarkText ? 'text-white hover:bg-white/10' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
  const themeToggleClass = forceDarkText ? 'text-white hover:bg-white/10 border-transparent shadow-none' : '';

  const renderPrimaryAction = (options: ActionOptions = {}) => {
    const widthClass = options.fullWidth ? ' w-full justify-center' : '';

    if (isAuthenticated) {
      let dashboardUrl = '/';
      if (user?.role === 'DOCTOR') dashboardUrl = '/medico/dashboard';
      else if (user?.role === 'PATIENT') dashboardUrl = '/paciente/dashboard';
      else if (user?.role === 'ADMIN') dashboardUrl = '/admin/dashboard';

      return (
        <div className={`flex items-center gap-3${options.fullWidth ? ' w-full flex-col' : ''}`}>
          <Link
            href={dashboardUrl}
            onClick={options.onAction}
            className={`${baseActionClasses} bg-teal-600 text-white hover:bg-teal-500 shadow-teal-500/20${widthClass}`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Meu Painel
          </Link>
          <button
            type="button"
            onClick={() => {
              signOut();
              options.onAction?.();
            }}
            className={`${baseActionClasses} ${forceDarkText ? 'border border-slate-700 text-slate-300 hover:bg-red-500 hover:border-red-500 hover:text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-500 dark:hover:text-white dark:hover:border-red-500'} ${widthClass}`}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-4${options.fullWidth ? ' w-full flex-col' : ''}`}>
        <Link
          href="/login"
          onClick={options.onAction}
          className={`${baseActionClasses} ${forceDarkText ? 'bg-transparent text-white hover:text-teal-400 shadow-none border border-transparent hover:border-white/10' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'} ${widthClass}`}
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          onClick={options.onAction}
          className={`${baseActionClasses} bg-teal-600 text-white hover:bg-teal-500 shadow-teal-500/20${widthClass}`}
        >
          Criar Conta
        </Link>
      </div>
    );
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((previous) => {
      const next = !previous;
      if (next) setIsMenuVisible(true);
      return next;
    });
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    if (isMobileMenuOpen) setIsMenuVisible(true);
    else if (isMenuVisible) {
      const t = setTimeout(() => setIsMenuVisible(false), 200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isMobileMenuOpen, isMenuVisible]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = originalOverflow || '';
    return () => { document.body.style.overflow = originalOverflow || ''; };
  }, [isMobileMenuOpen]);

  return (
    <header className={headerClass}>
      <nav className="mx-auto max-w-7xl flex items-center justify-between px-6">
        {isValidationRoute ? (
          <span className={`text-2xl font-black ${logoColor} tracking-tighter cursor-default`} aria-disabled="true">Zello<span className="text-teal-500">.</span></span>
        ) : (
          <Link href={getLogoHref()} className="flex items-center gap-2 group transition-transform hover:scale-105">
            <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className={`text-2xl font-black ${logoColor} tracking-tighter`}>Zello</span>
          </Link>
        )}

        {!shouldHideActions && (
          <>
            <div className="hidden lg:flex items-center gap-10">
              {isLandingPage && (
                <div className="flex items-center gap-8 text-sm font-bold">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`transition-colors duration-200 ${navLinkClass}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
              
              <div className={`flex items-center gap-4 pl-8 border-l ${forceDarkText ? 'border-white/10' : 'border-slate-200 dark:border-slate-700'}`}>
                {renderPrimaryAction()}
                <ThemeToggle className={`ml-2 ${themeToggleClass}`} />
              </div>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle className={themeToggleClass} />
              <button
                type="button"
                ref={menuButtonRef}
                onClick={toggleMobileMenu}
                className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors duration-200 ${menuButtonClass}`}
                aria-label={isMobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </>
        )}
        
        {/* ThemeToggle always visible as rightmost element, even on routes that hide nav actions */}
        {shouldHideActions && (
          <ThemeToggle className={themeToggleClass} />
        )}
      </nav>

      {/* Mobile Menu */}
      {typeof document !== 'undefined' && !shouldHideActions && isMenuVisible
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex lg:hidden">
              <div
                role="presentation"
                onClick={closeMobileMenu}
                className={`absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0' } pointer-events-auto`}
              />

              <div
                id="mobile-navigation"
                ref={panelRef}
                className={`absolute right-0 top-0 bottom-0 flex w-[85vw] max-w-sm flex-col bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                aria-hidden={!isMobileMenuOpen}
              >
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-6">
                  <span className="text-2xl font-black text-white tracking-tighter">Zello<span className="text-teal-500">.</span></span>
                  <button
                    type="button"
                    onClick={closeMobileMenu}
                    className="rounded-full bg-slate-800 p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="px-6 py-8 text-slate-300 flex-grow overflow-y-auto">
                  <ul className="space-y-6">
                    {navLinks.map((link, i) => {
                      const Icon = navIcons[i];
                      return (
                        <li key={`mobile-${link.label}`}>
                          <Link
                            href={link.href}
                            onClick={closeMobileMenu}
                            className="group flex items-center text-lg font-bold transition-colors duration-200 hover:text-teal-400"
                          >
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mr-4 group-hover:bg-teal-500/20 group-hover:text-teal-400 transition-colors">
                              <Icon className="h-5 w-5" />
                            </div>
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="border-t border-slate-800 px-6 py-8 bg-slate-900">
                  {isAuthenticated ? (
                     <div className="flex flex-col gap-4">
                        <Link
                          href={user?.role === 'DOCTOR' ? '/medico/dashboard' : '/paciente/dashboard'}
                          onClick={closeMobileMenu}
                          className={`${baseActionClasses} bg-teal-600 text-white w-full`}
                        >
                          Meu Painel
                        </Link>
                        <button
                          type="button"
                          onClick={() => { signOut(); closeMobileMenu(); }}
                          className={`${baseActionClasses} border border-slate-700 text-slate-300 w-full`}
                        >
                          Sair
                        </button>
                     </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Link
                        href="/cadastro"
                        onClick={closeMobileMenu}
                        className={`${baseActionClasses} bg-teal-600 text-white hover:bg-teal-500 w-full`}
                      >
                        Criar Conta Livre
                      </Link>
                      <Link
                        href="/login"
                        onClick={closeMobileMenu}
                        className={`${baseActionClasses} border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white w-full`}
                      >
                        Já tenho conta
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
