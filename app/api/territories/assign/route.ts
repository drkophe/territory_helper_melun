/**
 * API Route: Attribuer un territoire
 * POST /api/territories/assign
 */

import { NextResponse } from 'next/server';
import { AssignTerritorySchema } from '@/features/google-sheets/writer-types';
import { assignTerritory } from '@/features/google-sheets/writer';

export async function POST(request: Request) {
  try {
    // 1. Parser le body
    const body = await request.json();

    // 2. Valider avec Zod
    const validation = AssignTerritorySchema.safeParse(body);

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

    // 3. Attribuer le territoire
    console.log('📥 API /assign - Payload:', payload);
    const updatedTerritory = await assignTerritory(payload);

    // 4. Retourner le territoire mis à jour
    return NextResponse.json({
      success: true,
      territory: updatedTerritory,
    });
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'attribution:', error);

    return NextResponse.json(
      {
        error: error.message || 'Erreur lors de l\'attribution du territoire',
      },
      { status: 500 }
    );
  }
}
