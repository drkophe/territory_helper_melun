/**
 * API Route: Marquer un territoire comme rendu
 * POST /api/territories/return
 */

import { NextResponse } from 'next/server';
import { ReturnTerritorySchema } from '@/features/google-sheets/writer-types';
import { returnTerritory } from '@/features/google-sheets/writer';

export async function POST(request: Request) {
  try {
    // 1. Parser le body
    const body = await request.json();

    // 2. Valider avec Zod
    const validation = ReturnTerritorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const payload = validation.data;

    // 3. Marquer comme rendu
    console.log('📥 API /return - Payload:', payload);
    const updatedTerritory = await returnTerritory(payload);

    // 4. Retourner le territoire mis à jour
    return NextResponse.json({
      success: true,
      territory: updatedTerritory,
    });
  } catch (error: any) {
    console.error('❌ Erreur lors du retour:', error);

    return NextResponse.json(
      {
        error: error.message || 'Erreur lors du retour du territoire',
      },
      { status: 500 }
    );
  }
}
