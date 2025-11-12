/**
 * Repository pour lire et mapper les données Google Sheets
 */

import { getSheetsClient, getSheetId } from './client';
import type { SheetRow, SheetTabData, SheetTabName } from './types';
import { SHEET_TABS } from './types';
import type { TerritorySheetRow } from '@/features/territories/types';

/**
 * Lit un onglet Google Sheets et retourne les données brutes
 */
async function readSheetTab(tabName: string): Promise<SheetRow[]> {
  const client = getSheetsClient();
  const sheetId = getSheetId();

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A1:Z1000`, // Lecture des colonnes A à Z, lignes 1 à 1000
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.warn(`Onglet "${tabName}" vide ou introuvable`);
      return [];
    }

    // La première ligne contient les en-têtes
    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);
    console.log(`📊 Onglet "${tabName}": ${dataRows.length} lignes, colonnes:`, headers);

    // Mapper chaque ligne en objet avec les en-têtes comme clés
    return dataRows.map((row) => {
      const rowData: SheetRow = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] as string | undefined;
      });
      return rowData;
    });
  } catch (error) {
    console.error(`Erreur lors de la lecture de l'onglet "${tabName}":`, error);
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
 * Mappe une ligne Google Sheets brute vers TerritorySheetRow
 *
 * Mapping des colonnes :
 * - "Num." → code
 * - "Nom & Prénom" → fullName
 * - "Prénom" → firstName
 * - "Remis le" → givenAt
 * - "Contacté le" → contactAt
 * - "Limite" → limitAt
 * - "Rendu le" → returnedAt
 * - "Commentaire" → comment
 * - "Info" → info
 * - "Sortie" → sortieFlag
 * - "Campagne" → campaign
 */
function mapRowToTerritorySheetRow(
  row: SheetRow,
  city: string,
  sheetName: string
): TerritorySheetRow | null {
  const code = row['Num.']?.trim();

  // Si pas de code, on ignore la ligne
  if (!code) {
    return null;
  }

  return {
    city,
    code,
    fullName: row['Nom & Prénom']?.trim() || undefined,
    firstName: row['Prénom']?.trim() || undefined,
    givenAt: row['Remis le']?.trim() || undefined,
    contactAt: row['Contacté le']?.trim() || undefined,
    limitAt: row['Limite']?.trim() || undefined,
    returnedAt: row['Rendu le']?.trim() || undefined,
    comment: row['Commentaire']?.trim() || undefined,
    info: row['Info']?.trim() || undefined,
    sortieFlag: row['Sortie']?.trim() || undefined,
    campaign: row['Campagne']?.trim() || undefined,
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
  console.log('📋 Exemples de territoires (premiers 5):', territories.slice(0, 5).map(t => ({ code: t.code, city: t.city, fullName: t.fullName })));
  return territories;
}
