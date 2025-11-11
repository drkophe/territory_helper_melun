/**
 * Middleware Next.js pour protéger les routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('territory_auth');
  const isAuthenticated = authCookie?.value === 'authenticated';
  const isLoginPage = request.nextUrl.pathname === '/';
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

  // Routes publiques : page de login et API d'auth
  const isPublicRoute = isLoginPage || isAuthApi;

  // Pour les routes API (hors auth), vérifier l'authentification mais ne pas rediriger
  // Laisser l'API gérer l'erreur 401
  if (isApiRoute && !isAuthApi) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Si non authentifié et pas sur une route publique, rediriger vers login
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si authentifié et sur la page de login, rediriger vers /carte
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/carte', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
