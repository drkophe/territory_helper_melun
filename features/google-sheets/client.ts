/**
 * Client Google Sheets avec authentification service account
 */

import { google } from 'googleapis';
import { getEnvVar } from '@/lib/utils';

// Singleton du client Google Sheets
let sheetsClient: ReturnType<typeof google.sheets> | null = null;

/**
 * Obtient le client Google Sheets authentifié (singleton)
 */
export function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  // Récupérer les variables d'environnement
  const serviceAccountEmail = getEnvVar('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = getEnvVar('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n');

  // Créer le client d'authentification JWT
  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  // Créer le client Google Sheets
  sheetsClient = google.sheets({ version: 'v4', auth });

  return sheetsClient;
}

/**
 * Obtient l'ID du Google Sheet depuis les variables d'environnement
 */
export function getSheetId(): string {
  return getEnvVar('GOOGLE_SHEET_ID');
}
