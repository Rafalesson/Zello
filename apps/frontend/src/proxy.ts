// Endereço: apps/frontend/src/proxy.ts (migrado de middleware.ts para Next.js 16)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('zello.token')?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    '/dashboard',
    '/medico/dashboard',
    '/medico/agenda',
    '/medico/atestados',
    '/medico/receitas',
    '/admin',
    '/paciente'
  ];
  const publicRoutes = ['/login', '/cadastro', '/recuperar-senha', '/redefinir-senha'];

  // Se não há token e o usuário tenta acessar uma rota protegida...
  if (!token && protectedRoutes.some(p => pathname.startsWith(p))) {
    // ...redireciona para o login.
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (token) {
    try {
      const payload = decodeJwt(token);
      if (!payload) throw new Error("Invalid token payload");
      const userRole = payload.role as string;

      const doctorDashboardPaths = ['/medico/dashboard', '/medico/agenda', '/medico/atestados', '/medico/receitas'];
      const adminDashboardPaths = ['/admin'];
      const patientDashboardPaths = ['/paciente'];

      const isDoctorPath = doctorDashboardPaths.some(p => pathname.startsWith(p));
      const isAdminPath = adminDashboardPaths.some(p => pathname.startsWith(p));
      const isPatientPath = patientDashboardPaths.some(p => pathname.startsWith(p));
      const isLegacyPath = pathname.startsWith('/dashboard');

      // Se um PACIENTE tenta acessar rotas de médico, admin ou legado...
      if (userRole === 'PATIENT') {
        if (isDoctorPath || isAdminPath || isLegacyPath) {
          return NextResponse.redirect(new URL('/paciente/dashboard', request.url));
        }
      }
      
      // Se um MÉDICO tenta acessar rotas de admin, paciente ou legado...
      else if (userRole === 'DOCTOR') {
        if (isAdminPath || isPatientPath || isLegacyPath) {
          return NextResponse.redirect(new URL('/medico/dashboard', request.url));
        }
      }
      
      // Se um ADMIN tenta acessar rotas de médico, paciente ou legado...
      else if (userRole === 'ADMIN') {
        if (isDoctorPath || isPatientPath || isLegacyPath) {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
      }

      // Se um usuário JÁ LOGADO tenta acessar as páginas de login/cadastro...
      if (publicRoutes.some(p => pathname.startsWith(p))) {
        let dashboardUrl = '/';
        if (userRole === 'DOCTOR') dashboardUrl = '/medico/dashboard';
        else if (userRole === 'ADMIN') dashboardUrl = '/admin/dashboard';
        else if (userRole === 'PATIENT') dashboardUrl = '/paciente/dashboard';
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }

    } catch (error) {
      // Se o token for inválido, redirecionamos para o login COM uma mensagem de erro.
      console.error("Token inválido ou expirado:", error);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'session_expired');
      
      const response = NextResponse.redirect(loginUrl);
      // Limpa o cookie inválido do navegador do usuário
      response.cookies.delete('zello.token');
      return response;
    }
  }

  return NextResponse.next();
}

// O matcher cobre todas as nossas rotas.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/medico/dashboard/:path*',
    '/medico/agenda/:path*',
    '/medico/atestados/:path*',
    '/medico/receitas/:path*',
    '/admin/:path*',
    '/paciente/:path*',
    '/login',
    '/cadastro/:path*',
    '/recuperar-senha',
    '/redefinir-senha'
  ],
};