/**
 * API Route pour récupérer les territoires
 */

import { NextResponse } from 'next/server';
import { loadTerritories } from '@/features/territories/services/kmlParser';

export async function GET() {
  try {
    const territories = await loadTerritories();
    return NextResponse.json(territories);
  } catch (error) {
    console.error('Error loading territories:', error);
    return NextResponse.json(
      { error: 'Failed to load territories' },
      { status: 500 }
    );
  }
}
