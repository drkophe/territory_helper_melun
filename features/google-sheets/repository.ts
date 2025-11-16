/**
 * Repository pour lire et mapper les données Google Sheets
 * Version 2: Support des en-têtes variés et normalisation
 */

import { getSheetsClient, getSheetId } from './client';
import type { SheetRow, SheetTabData, SheetTabName } from './types';
import { SHEET_TABS } from './types';
import type { TerritorySheetRow } from '@/features/territories/types';
import { buildHeaderMapping, normalizeTerritoryCode } from './normalization';

/**
 * Lit un onglet Google Sheets et retourne les données brutes
 */
async function readSheetTab(tabName: string): Promise<SheetRow[]> {
  const client = getSheetsClient();
  const sheetId = getSheetId();

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A1:Z2000`, // Lecture étendue pour capturer toutes les lignes
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.warn(`⚠️ Onglet "${tabName}" vide ou introuvable`);
      return [];
    }

    // La première ligne contient les en-têtes
    const headerRow = rows[0] as string[];
    const dataRows = rows.slice(1);

    console.log(`📋 [${tabName}] Headers bruts:`, headerRow);

    // Construire le mapping des en-têtes vers les propriétés
    const headerMapping = buildHeaderMapping(headerRow);
    console.log(`🧭 [${tabName}] Headers normalisés:`, headerMapping);

    // Mapper chaque ligne en objet avec les propriétés normalisées
    const mappedRows: SheetRow[] = [];

    for (const row of dataRows) {
      // Ignorer les lignes complètement vides
      const isBlank = !row.some((cell) => (cell ?? '').toString().trim());
      if (isBlank) continue;

      const rowData: SheetRow = {};

      headerMapping.forEach((mappedKey, index) => {
        if (mappedKey === 'ignore') return;

        const cellValue = row[index];
        if (cellValue !== undefined && cellValue !== null) {
          const trimmed = cellValue.toString().trim();
          if (trimmed) {
            rowData[mappedKey] = trimmed;
          }
        }
      });

      mappedRows.push(rowData);
    }

    console.log(`✅ [${tabName}] ${mappedRows.length} lignes valides sur ${dataRows.length} total`);
    return mappedRows;
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture de l'onglet "${tabName}":`, error);
    throw new Error(`Failed to read sheet tab: ${tabName}`);
  }
}

/**
 * Lit tous les onglets configurés
 */
export async function readAllSheetTabs(): Promise<SheetTabData[]> {
  const tabsData: SheetTabData[] = [];

  for (const tabName of SHEET_TABS) {
    const rows = await readSheetTab(tabName);
    tabsData.push({
      tabName,
      rows,
    });
  }

  return tabsData;
}

/**
 * Mappe une ligne normalisée vers TerritorySheetRow
 */
function mapRowToTerritorySheetRow(
  row: SheetRow,
  city: string,
  sheetName: string
): TerritorySheetRow | null {
  const rawCode = row['code']?.trim();

  // Si pas de code, on ignore la ligne
  if (!rawCode) {
    return null;
  }

  // Normaliser le code pour le matching
  const code = normalizeTerritoryCode(rawCode);

  return {
    city,
    code,
    fullName: row['fullName'] || undefined,
    firstName: row['firstName'] || undefined,
    givenAt: row['givenAt'] || undefined,
    contactAt: row['contactAt'] || undefined,
    limitAt: row['limitAt'] || undefined,
    returnedAt: row['returnedAt'] || undefined,
    comment: row['comment'] || undefined,
    info: row['info'] || undefined,
    sortieFlag: row['sortieFlag'] || undefined,
    campaign: row['campaign'] || undefined,
    folder: row['folder'] || undefined,
    sheetName,
  };
}

/**
 * Lit tous les territoires depuis Google Sheets et les mappe
 */
export async function getAllTerritoriesFromSheets(): Promise<TerritorySheetRow[]> {
  const allTabsData = await readAllSheetTabs();
  const territories: TerritorySheetRow[] = [];

  for (const tabData of allTabsData) {
    const city = tabData.tabName;

    for (const row of tabData.rows) {
      const territory = mapRowToTerritorySheetRow(row, city, tabData.tabName);
      if (territory) {
        territories.push(territory);
      }
    }
  }

  console.log(`✅ ${territories.length} territoires lus depuis Google Sheets`);
  console.log(
    '🔑 Sheets codes (20 premiers):',
    territories.slice(0, 20).map((t) => t.code)
  );
  console.log(
    '📋 Exemples (5 premiers):',
    territories.slice(0, 5).map((t) => ({
      code: t.code,
      city: t.city,
      fullName: t.fullName,
      givenAt: t.givenAt,
      returnedAt: t.returnedAt,
    }))
  );

  return territories;
}
