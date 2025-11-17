/**
 * Fonctions d'écriture dans Google Sheets pour les territoires
 */

import { google } from 'googleapis';
import type { AssignTerritoryPayload, ReturnTerritoryPayload } from './writer-types';
import { findTerritoryPosition } from './index-builder';
import { buildHeaderMapping } from './normalization';
import { fetchSheetData } from './repository';
import type { EnrichedTerritoryProperties, TerritorySheetRow } from '../territories/types';
import { computeTerritoryStatus, computeAvailabilityPriority, computeDaysSinceLastReturn } from '../territories/status';

/**
 * Client Google Sheets pour l'écriture
 */
function getSheetsClient() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  };

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Calcule les dates Contact et Limite à partir de la date de remise
 * Logique: Contacter = +3 mois, Limite = +4 mois
 */
function calculateFollowUpDates(givenAt: string): { contactAt: string; limitAt: string } {
  // Parse DD/MM/YYYY
  const [day, month, year] = givenAt.split('/').map(Number);
  const givenDate = new Date(year, month - 1, day);

  // +3 mois pour Contact
  const contactDate = new Date(givenDate);
  contactDate.setMonth(contactDate.getMonth() + 3);

  // +4 mois pour Limite
  const limitDate = new Date(givenDate);
  limitDate.setMonth(limitDate.getMonth() + 4);

  const formatDate = (date: Date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  return {
    contactAt: formatDate(contactDate),
    limitAt: formatDate(limitDate),
  };
}

/**
 * Attribue un territoire (écriture dans Google Sheets)
 */
export async function assignTerritory(
  payload: AssignTerritoryPayload
): Promise<EnrichedTerritoryProperties> {
  console.log('📝 Attribution du territoire:', payload.code);

  // 1. Trouver la position du territoire
  const position = await findTerritoryPosition(payload.code);
  if (!position) {
    throw new Error(`Territoire ${payload.code} introuvable dans Google Sheets`);
  }

  const { sheetName, rowIndex } = position;
  console.log(`📍 Position trouvée: ${sheetName}, ligne ${rowIndex}`);

  // 2. Lire l'en-tête pour connaître les colonnes
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z1`,
  });

  const headerRow = headerResponse.data.values?.[0] || [];
  const headerMap = buildHeaderMapping(headerRow);

  // 3. Calculer les dates Contact et Limite si non fournies
  const followUpDates = calculateFollowUpDates(payload.givenAt);
  const contactAt = payload.contactAt || followUpDates.contactAt;
  const limitAt = payload.limitAt || followUpDates.limitAt;

  // 4. Préparer les valeurs à écrire
  const updates: Array<{ column: string; value: string }> = [
    { column: 'fullName', value: payload.fullName },
    { column: 'givenAt', value: payload.givenAt },
    { column: 'contactAt', value: contactAt },
    { column: 'limitAt', value: limitAt },
  ];

  if (payload.firstName) {
    updates.push({ column: 'firstName', value: payload.firstName });
  }

  if (payload.comment) {
    updates.push({ column: 'comment', value: payload.comment });
  }

  // Vider la date de retour (le territoire devient assigné)
  updates.push({ column: 'returnedAt', value: '' });

  // 5. Construire les requêtes de mise à jour
  const batchData: Array<{ range: string; values: string[][] }> = [];

  for (const update of updates) {
    const columnIndex = headerMap.get(update.column);
    if (columnIndex !== undefined) {
      const columnLetter = String.fromCharCode(65 + columnIndex); // A=65
      const range = `${sheetName}!${columnLetter}${rowIndex}`;
      batchData.push({
        range,
        values: [[update.value]],
      });
    }
  }

  // 6. Exécuter la mise à jour batch
  console.log(`✍️ Mise à jour de ${batchData.length} colonnes...`);
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: batchData,
    },
  });

  console.log('✅ Territoire attribué dans Google Sheets');

  // 7. Relire la ligne mise à jour et reconstruire le Territory
  const updatedTerritory = await reFetchTerritory(payload.code, sheetName);

  return updatedTerritory;
}

/**
 * Marque un territoire comme rendu (écriture dans Google Sheets)
 */
export async function returnTerritory(
  payload: ReturnTerritoryPayload
): Promise<EnrichedTerritoryProperties> {
  console.log('📝 Retour du territoire:', payload.code);

  // 1. Trouver la position
  const position = await findTerritoryPosition(payload.code);
  if (!position) {
    throw new Error(`Territoire ${payload.code} introuvable dans Google Sheets`);
  }

  const { sheetName, rowIndex } = position;
  console.log(`📍 Position trouvée: ${sheetName}, ligne ${rowIndex}`);

  // 2. Lire l'en-tête
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z1`,
  });

  const headerRow = headerResponse.data.values?.[0] || [];
  const headerMap = buildHeaderMapping(headerRow);

  // 3. Préparer les mises à jour
  const updates: Array<{ column: string; value: string }> = [
    { column: 'returnedAt', value: payload.returnedAt },
  ];

  if (payload.comment) {
    updates.push({ column: 'comment', value: payload.comment });
  }

  // Si clearAssignment = true, vider les champs d'attribution
  if (payload.clearAssignment) {
    updates.push(
      { column: 'fullName', value: '' },
      { column: 'firstName', value: '' },
      { column: 'givenAt', value: '' },
      { column: 'contactAt', value: '' },
      { column: 'limitAt', value: '' }
    );
  }

  // 4. Construire les requêtes batch
  const batchData: Array<{ range: string; values: string[][] }> = [];

  for (const update of updates) {
    const columnIndex = headerMap.get(update.column);
    if (columnIndex !== undefined) {
      const columnLetter = String.fromCharCode(65 + columnIndex);
      const range = `${sheetName}!${columnLetter}${rowIndex}`;
      batchData.push({
        range,
        values: [[update.value]],
      });
    }
  }

  // 5. Exécuter la mise à jour
  console.log(`✍️ Mise à jour de ${batchData.length} colonnes...`);
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: batchData,
    },
  });

  console.log('✅ Territoire marqué comme rendu dans Google Sheets');

  // 6. Relire et reconstruire
  const updatedTerritory = await reFetchTerritory(payload.code, sheetName);

  return updatedTerritory;
}

/**
 * Relit un territoire depuis Google Sheets et reconstruit l'objet complet
 * Note: Simplifié pour Sprint 3, sans fusion KML (on retourne juste les props Sheets)
 */
async function reFetchTerritory(
  code: string,
  sheetName: string
): Promise<EnrichedTerritoryProperties> {
  // Relire toutes les données de cet onglet
  const sheetData = await fetchSheetData(sheetName as any);

  // Trouver la ligne correspondante
  const row = sheetData.find((r) => r.code === code);

  if (!row) {
    throw new Error(`Territoire ${code} introuvable après mise à jour`);
  }

  // Calculer le statut et les métriques
  const status = computeTerritoryStatus(row);
  const daysSinceLastReturn = computeDaysSinceLastReturn(row);
  const availabilityPriority = status === 'available' ? computeAvailabilityPriority(row) : undefined;

  // Construire l'objet enrichi
  // Note: On ne fusionne pas avec KML ici (simplification Sprint 3)
  // Dans une version complète, il faudrait récupérer le Feature KML correspondant
  const enriched: EnrichedTerritoryProperties = {
    ...row,
    status,
    daysSinceLastReturn,
    availabilityPriority,
    // Propriétés minimales pour compatibilité (à adapter selon votre structure)
    name: code,
    folder: row.city || '',
    sheetName,
  };

  return enriched;
}
