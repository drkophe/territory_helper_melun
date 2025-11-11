/**
 * API Route pour la déconnexion
 */

import { NextResponse } from 'next/server';
import { deleteSession } from '@/features/auth/lib/auth';

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
