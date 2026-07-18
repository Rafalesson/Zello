'use client';

import { LayoutDashboard, FileText, Calendar, LogOut, Shield, Activity, List, Settings, Sun, Moon, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/contexts/AuthProvider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Modal } from '@/components/common/Modal';

interface SidebarProps {
  closeSidebar?: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

export function Sidebar({ closeSidebar, isCollapsed = false, toggleCollapse }: SidebarProps) {
  const { user, signOut } = useContext(AuthContext);
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U';
    const cleaned = name.replace(/^(Dr\.|Dra\.|Dr|Dra)\s*/i, '').trim();
    const parts = cleaned.split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const doctorNavigation = [
    { name: 'Dashboard', href: '/medico/dashboard', icon: LayoutDashboard },
    { name: 'Consultas', href: '/medico/consultas', icon: List },
    { name: 'Atestados', href: '/medico/atestados', icon: FileText },
    { name: 'Receitas', href: '/medico/receitas', icon: FileText },
    { name: 'Agenda', href: '/medico/agenda', icon: Calendar },
    { name: 'Configurações', href: '/medico/configuracoes', icon: Settings },
  ];

  const adminNavigation = [
    { name: 'Visão Geral', href: '/admin/dashboard', icon: Activity },
    { name: 'Governança', href: '/admin/governanca', icon: Shield },
    { name: 'Logs de Auditoria', href: '/admin/auditoria', icon: List },
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
  ];

  const patientNavigation = [
    { name: 'Dashboard', href: '/paciente/dashboard', icon: LayoutDashboard },
    { name: 'Consultas', href: '/paciente/consultas', icon: List },
    { name: 'Atestados', href: '/paciente/atestados', icon: FileText },
    { name: 'Receitas', href: '/paciente/receitas', icon: FileText },
    { name: 'Configurações', href: '/paciente/configuracoes', icon: Settings },
  ];

  const navigation = user?.role === 'ADMIN' ? adminNavigation : user?.role === 'PATIENT' ? patientNavigation : doctorNavigation;
  const userName = user?.role === 'DOCTOR' ? user?.doctorProfile?.name : user?.role === 'PATIENT' ? user?.patientProfile?.name : user?.email;
  const userRoleText = user?.role === 'DOCTOR' ? 'Médico(a)' : user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'PATIENT' ? 'Paciente' : 'Usuário';

  return (
    <aside className={`h-full flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white flex flex-col p-4 transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-64'}`}>
      
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between'} mb-6 select-none`}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter leading-none">Zello</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase mt-1">Telemedicina</span>
            </div>
          )}
        </div>
        {toggleCollapse && (
          <button 
            onClick={toggleCollapse} 
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isCollapsed ? 'mt-2' : ''}`}
            title={isCollapsed ? "Expandir Menu (Ctrl+B)" : "Recolher Menu (Ctrl+B)"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* User Profile Widget */}
      <div className="mb-6">
        {!isCollapsed ? (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md flex-shrink-0">
              {getUserInitials(userName)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">
                {userName}
              </h4>
              <span className="inline-block mt-0.5 text-[9px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full border border-teal-100/50 dark:border-teal-900/30">
                {userRoleText}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={userName || ''}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
              {getUserInitials(userName)}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow">
        <ul className="space-y-1.5">
          {navigation.map((item) => {
            const isActive = item.href === '/medico/dashboard' || item.href === '/admin/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center rounded-lg transition-all duration-200 text-sm font-medium ${
                    isCollapsed ? 'justify-center p-2.5' : 'p-2.5'
                  } ${
                    isActive
                      ? 'bg-teal-50/80 text-teal-700 dark:bg-slate-800 dark:text-teal-400 font-bold border-l-4 border-teal-500 pl-1.5'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Settings & Logout */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`flex items-center w-full rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white text-sm font-medium ${
            isCollapsed ? 'justify-center p-2.5' : 'p-2.5'
          }`}
          title={isCollapsed ? (isDark ? 'Modo Claro' : 'Modo Escuro') : undefined}
        >
          {isDark ? (
            <Sun className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-amber-500`} />
          ) : (
            <Moon className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-teal-600`} />
          )}
          {!isCollapsed && <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>

        {/* Logout Button */}
        <button 
          onClick={() => setIsLogoutModalOpen(true)} 
          className={`flex items-center w-full rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all duration-200 text-sm font-medium ${
            isCollapsed ? 'justify-center p-2.5' : 'p-2.5'
          }`}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-red-500`} />
          {!isCollapsed && <span>Sair do Sistema</span>}
        </button>
      </div>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirmar Saída"
        maxWidth="max-w-sm"
      >
        <div className="mt-2 space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tem certeza que deseja sair do sistema? Suas sessões ativas serão encerradas.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setIsLogoutModalOpen(false);
                signOut();
              }}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all text-sm shadow-sm"
            >
              Sim, Sair
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  );
}
