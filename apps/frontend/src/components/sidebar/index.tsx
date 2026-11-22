'use client';

import { LayoutDashboard, FileText, Calendar, LogOut } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthProvider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  closeSidebar?: () => void;
}

export function Sidebar({ closeSidebar }: SidebarProps) {
  const { user, signOut } = useContext(AuthContext);
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Atestados', href: '/dashboard/atestados', icon: FileText },
    { name: 'Receitas', href: '/dashboard/receitas', icon: FileText },
    { name: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
  ];

  return (
    <aside className="h-full w-64 flex-shrink-0 bg-gray-800 text-white flex flex-col p-4">
      <div className="text-2xl font-bold mb-10">Zello</div>
      <nav className="flex-grow">
        <ul>
          {navigation.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <li key={item.name} className="mb-4">
                <Link
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-700' // Estilo ativo
                      : 'hover:bg-gray-700' // Estilo inativo
                  }`}
                >
                  <item.icon className="mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto">
        <div className="mb-4 p-2 border-t border-gray-700">
            <p className="font-semibold">{user?.doctorProfile?.name || user?.email}</p>
            <p className="text-sm text-gray-400">
              {user?.role === 'DOCTOR'
                ? user.doctorProfile?.specialty?.trim() || 'Clínico Geral'
                : 'Usuário'}
            </p>
        </div>
        <button 
            onClick={signOut} 
            className="flex items-center w-full p-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          <LogOut className="mr-3" /> Sair
        </button>
      </div>
    </aside>
  );
}


