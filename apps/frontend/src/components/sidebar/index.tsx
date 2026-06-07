'use client';

import { LayoutDashboard, FileText, Calendar, LogOut, Shield, Activity, List, Settings } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthProvider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SidebarProps {
  closeSidebar?: () => void;
}

export function Sidebar({ closeSidebar }: SidebarProps) {
  const { user, signOut } = useContext(AuthContext);
  const pathname = usePathname();

  const doctorNavigation = [
    { name: 'Dashboard', href: '/medico/dashboard', icon: LayoutDashboard },
    { name: 'Atestados', href: '/medico/atestados', icon: FileText },
    { name: 'Receitas', href: '/medico/receitas', icon: FileText },
    { name: 'Agenda', href: '/medico/agenda', icon: Calendar },
  ];

  const adminNavigation = [
    { name: 'Visão Geral', href: '/admin/dashboard', icon: Activity },
    { name: 'Governança', href: '/admin/governanca', icon: Shield },
    { name: 'Logs de Auditoria', href: '/admin/auditoria', icon: List },
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
  ];

  const navigation = user?.role === 'ADMIN' ? adminNavigation : doctorNavigation;

  return (
    <aside className="h-full w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white flex flex-col p-4 transition-colors">
      <div className="flex items-center justify-between mb-10">
        <Link href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/medico/dashboard'}>
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">Zello</span>
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex-grow">
        <ul>
          {navigation.map((item) => {
            const isActive = item.href === '/medico/dashboard' || item.href === '/admin/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <li key={item.name} className="mb-2">
                <Link
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center p-2.5 rounded-lg transition-colors text-sm font-medium ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 dark:bg-slate-800 dark:text-teal-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto">
        <div className="mb-4 p-2 border-t border-slate-200 dark:border-slate-700">
            <p className="font-semibold truncate text-slate-800 dark:text-white">{user?.doctorProfile?.name || user?.email}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user?.role === 'DOCTOR' ? 'Médico(a)' : user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
            </p>
        </div>
        <button 
            onClick={signOut} 
            className="flex items-center w-full p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" /> Sair
        </button>
      </div>
    </aside>
  );
}
