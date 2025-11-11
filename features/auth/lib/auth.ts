/**
 * Utilitaires d'authentification côté serveur
 */

import { cookies } from 'next/headers';
import { getEnvVar } from '@/lib/utils';

const AUTH_COOKIE_NAME = 'territory_auth';
const AUTH_PASSWORD = getEnvVar('AUTH_PASSWORD', 'melun2024');

/**
 * Vérifie si le mot de passe fourni est correct
 */
export function verifyPassword(password: string): boolean {
  return password === AUTH_PASSWORD;
}

/**
 * Crée une session utilisateur (cookie)
 */
export async function createSession() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: '/',
  });
}

/**
 * Supprime la session utilisateur
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  return authCookie?.value === 'authenticated';
}
