/**
 * API Route pour récupérer les territoires enrichis
 * (KML + Google Sheets + statut calculé)
 */

import { NextResponse } from 'next/server';
import { loadTerritories } from '@/features/territories/services/kmlParser';
import { getAllTerritoriesFromSheets } from '@/features/google-sheets/repository';
import { enrichTerritoriesWithSheets } from '@/features/territories/merger';

export async function GET() {
  try {
    console.log('📍 Chargement des territoires depuis KML...');
    const kmlTerritories = await loadTerritories();

    console.log('📊 Chargement des données Google Sheets...');
    const sheetsData = await getAllTerritoriesFromSheets();

    console.log('🔗 Fusion KML + Sheets...');
    const enrichedTerritories = enrichTerritoriesWithSheets(kmlTerritories, sheetsData);

    console.log(`✅ ${enrichedTerritories.features.length} territoires enrichis retournés`);
    return NextResponse.json(enrichedTerritories);
  } catch (error) {
    console.error('❌ Error loading territories:', error);
    return NextResponse.json(
      { error: 'Failed to load territories' },
      { status: 500 }
    );
  }
}
