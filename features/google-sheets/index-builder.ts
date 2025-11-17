/**
 * Construction de l'index code → position dans Google Sheets
 */

import { google } from 'googleapis';
import type { TerritoryIndex, TerritoryPosition } from './writer-types';
import { SHEET_TABS, type SheetTabName } from './types';
import { buildHeaderMapping, normalizeTerritoryCode } from './normalization';

/**
 * Construit un index complet code → (sheetName, rowIndex)
 * en parcourant toutes les feuilles configurées
 */
export async function buildTerritoryIndex(): Promise<TerritoryIndex> {
  const index: TerritoryIndex = new Map();

  // Service account credentials
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  };

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  console.log('🔨 Construction de l\'index des territoires...');

  // Parcourir chaque onglet
  for (const sheetName of SHEET_TABS) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z1000`, // Lire jusqu'à 1000 lignes max
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        console.warn(`⚠️ Onglet ${sheetName} vide`);
        continue;
      }

      // En-tête = première ligne
      const headerRow = rows[0];
      const headerMap = buildHeaderMapping(headerRow);
      const codeColumnIndex = headerMap.get('code');

      if (codeColumnIndex === undefined) {
        console.warn(`⚠️ Colonne "code" non trouvée dans ${sheetName}`);
        continue;
      }

      // Parcourir les lignes de données (à partir de la ligne 2)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rawCode = row[codeColumnIndex];

        if (!rawCode) continue; // Ligne sans code

        const normalizedCode = normalizeTerritoryCode(rawCode);

        // Enregistrer la position
        index.set(normalizedCode, {
          sheetName: sheetName as SheetTabName,
          rowIndex: i + 1, // +1 car index 1-based (ligne 1 = en-tête)
        });
      }

      console.log(`✅ ${sheetName}: ${rows.length - 1} territoires indexés`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'indexation de ${sheetName}:`, error);
    }
  }

  console.log(`🎯 Index complet: ${index.size} territoires`);
  return index;
}

/**
 * Index global en cache (rechargé au démarrage de l'API)
 */
let globalIndex: TerritoryIndex | null = null;

/**
 * Récupère l'index global (le construit si nécessaire)
 */
export async function getOrBuildIndex(): Promise<TerritoryIndex> {
  if (!globalIndex) {
    globalIndex = await buildTerritoryIndex();
  }
  return globalIndex;
}

/**
 * Force le rafraîchissement de l'index
 */
export async function refreshIndex(): Promise<TerritoryIndex> {
  console.log('🔄 Rafraîchissement de l\'index...');
  globalIndex = await buildTerritoryIndex();
  return globalIndex;
}

/**
 * Trouve la position d'un territoire par son code
 */
export async function findTerritoryPosition(code: string): Promise<TerritoryPosition | null> {
  const index = await getOrBuildIndex();
  const normalizedCode = normalizeTerritoryCode(code);
  return index.get(normalizedCode) || null;
}
