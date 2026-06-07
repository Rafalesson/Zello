'use client';

import Link from 'next/link';
import { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogIn, LogOut, Menu, X, Info, Play, Users, Mail, MessageSquare } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthProvider';
import { ThemeToggle } from '../ThemeToggle';

type ActionOptions = {
  fullWidth?: boolean;
  onAction?: () => void;
};

const navLinks = [
  { label: 'Por que Zello?', href: '/#features' },
  { label: 'Como Funciona', href: '/#how-it-works' },
  { label: 'Depoimentos', href: '/#depoimentos' },
  { label: 'Sobre Nós', href: '/#about' },
  { label: 'Contato', href: '/#contato' },
];

const navIcons = [Info, Play, MessageSquare, Users, Mail];

export function Header() {
  const { isAuthenticated, user, signOut } = useContext(AuthContext);
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  const getLogoHref = () => {
    if (!isAuthenticated || !user) return '/';
    if (user.role === 'PATIENT') return '/paciente/dashboard';
    if (user.role === 'DOCTOR') return '/medico/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/';
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // keeps menu in DOM while animating out
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const hideButtonOnRoutes = ['/validar', '/receitas/validar', '/recuperar-senha', '/redefinir-senha', '/cadastro'];
  const shouldHideActions = hideButtonOnRoutes.some((route) => pathname.startsWith(route));
  const isValidationRoute = pathname.startsWith('/validar') || pathname.startsWith('/receitas/validar');

  const baseActionClasses =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

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
            className={`${baseActionClasses} border border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-slate-800 focus-visible:outline-teal-600${widthClass}`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              signOut();
              options.onAction?.();
            }}
            className={`${baseActionClasses} border border-red-600 text-red-600 hover:bg-red-600 hover:text-white focus-visible:outline-red-600${widthClass}`}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-3${options.fullWidth ? ' w-full flex-col' : ''}`}>
        <Link
          href="/cadastro"
          onClick={options.onAction}
          className={`${baseActionClasses} border border-transparent bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 focus-visible:outline-teal-600${widthClass}`}
        >
          Cadastre-se
        </Link>
        <Link
          href="/login"
          onClick={options.onAction}
          className={`${baseActionClasses} border border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-slate-800 focus-visible:outline-teal-600${widthClass}`}
        >
          <LogIn className="h-4 w-4" />
          Acessar
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // manage mount/unmount for animation
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMenuVisible(true);
    } else if (isMenuVisible) {
      // wait for animation to finish before removing from DOM
      const t = setTimeout(() => setIsMenuVisible(false), 200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isMobileMenuOpen, isMenuVisible]);

  // focus management and keyboard handling
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    // focus first link inside panel
    requestAnimationFrame(() => {
      const firstLink = panelRef.current?.querySelector('a');
      if (firstLink instanceof HTMLElement) {
        firstLink.focus();
      }
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMobileMenu();
        // restore focus after anim
        setTimeout(() => menuButtonRef.current?.focus(), 200);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileMenuOpen]);

  // lock body scroll while menu is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow || '';
    }

    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, [isMobileMenuOpen]);

  // when menu is closed programmatically (by overlay/X/primary action), ensure focus returns
  useEffect(() => {
    if (!isMobileMenuOpen && !isMenuVisible) {
      // fully closed
      menuButtonRef.current?.focus();
    }
  }, [isMobileMenuOpen, isMenuVisible]);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <nav className="flex items-center justify-between px-6 h-16">
        {isValidationRoute ? (
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 cursor-default" aria-disabled="true">Zello</span>
        ) : (
          <Link href={getLogoHref()}>
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">Zello</span>
          </Link>
        )}

        {!shouldHideActions && (
          <>
            {isLandingPage && (
              <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="transition-colors duration-200 hover:text-teal-600 dark:hover:text-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="hidden lg:flex items-center gap-4">
              {renderPrimaryAction()}
              <ThemeToggle />
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <button
                type="button"
                ref={menuButtonRef}
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 transition-colors duration-200 hover:border-slate-300 hover:text-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                aria-label={isMobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </>
        )}

        {/* ThemeToggle always visible as rightmost element, even on routes that hide nav actions */}
        {shouldHideActions && (
          <ThemeToggle />
        )}
      </nav>

      {typeof document !== 'undefined' && !shouldHideActions && isMenuVisible
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex lg:hidden">
              <div
                role="presentation"
                onClick={closeMobileMenu}
                className={`absolute inset-0 bg-slate-900 transition-opacity duration-200 ${isMobileMenuOpen ? 'opacity-40' : 'opacity-0' } pointer-events-auto`}
              />

              <div
                id="mobile-navigation"
                ref={panelRef}
                className={`relative left-0 flex h-full w-[75vw] max-w-sm flex-col bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-200 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                aria-hidden={!isMobileMenuOpen}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                  {isValidationRoute ? (
                    <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 cursor-default" aria-disabled="true">Zello</span>
                  ) : (
                    <Link href={getLogoHref()} onClick={closeMobileMenu}>
                      <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">Zello</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={closeMobileMenu}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-500 transition hover:border-red-600 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                    aria-label="Fechar menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Dashboard Action at the top (below Logo) */}
                {isAuthenticated && (
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <Link
                      href={
                        user?.role === 'DOCTOR' ? '/medico/dashboard' :
                        user?.role === 'PATIENT' ? '/paciente/dashboard' :
                        user?.role === 'ADMIN' ? '/admin/dashboard' : '/'
                      }
                      onClick={closeMobileMenu}
                      className={`${baseActionClasses} border border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-slate-800 focus-visible:outline-teal-600 w-full justify-center`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </div>
                )}

                {isLandingPage && (
                  <nav className="px-6 py-6 text-slate-700 flex-grow overflow-y-auto">
                    <ul className="space-y-6">
                      {navLinks.map((link, i) => {
                        const Icon = navIcons[i];
                        return (
                          <li key={`mobile-${link.label}`}>
                            <Link
                              href={link.href}
                              onClick={closeMobileMenu}
                              className="group flex items-center text-lg font-medium transition-colors duration-200 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                            >
                              <Icon className="h-5 w-5 mr-3 text-slate-500 transition-colors duration-200 group-hover:text-teal-600" />
                              {link.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                )}

                {/* Spacer to push logout button down if not on landing page */}
                {!isLandingPage && <div className="flex-grow" />}

                {/* Bottom Actions (Logout or Sign In / Sign Up) */}
                <div className="mt-auto border-t border-slate-100 dark:border-slate-800 px-6 py-6">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        closeMobileMenu();
                      }}
                      className={`${baseActionClasses} border border-red-600 text-red-600 hover:bg-red-600 hover:text-white focus-visible:outline-red-600 w-full justify-center`}
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/cadastro"
                        onClick={closeMobileMenu}
                        className={`${baseActionClasses} border border-transparent bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 focus-visible:outline-teal-600 w-full justify-center`}
                      >
                        Cadastre-se
                      </Link>
                      <Link
                        href="/login"
                        onClick={closeMobileMenu}
                        className={`${baseActionClasses} border border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-slate-800 focus-visible:outline-teal-600 w-full justify-center`}
                      >
                        <LogIn className="h-4 w-4" />
                        Acessar
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
