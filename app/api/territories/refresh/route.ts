/**
 * API Route: Rafraîchir l'index des territoires
 * POST /api/territories/refresh
 *
 * Utile si des modifications ont été faites directement dans Google Sheets
 */

import { NextResponse } from 'next/server';
import { refreshIndex } from '@/features/google-sheets/index-builder';

export async function POST() {
  try {
    console.log('🔄 API /refresh - Rafraîchissement de l\'index...');

    const index = await refreshIndex();

    return NextResponse.json({
      success: true,
      count: index.size,
      message: `Index rafraîchi: ${index.size} territoires`,
    });
  } catch (error: any) {
    console.error('❌ Erreur lors du rafraîchissement:', error);

    return NextResponse.json(
      {
        error: error.message || 'Erreur lors du rafraîchissement de l\'index',
      },
      { status: 500 }
    );
  }
}
