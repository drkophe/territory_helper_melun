/**
 * Types pour l'intégration Google Sheets
 */

// Ligne brute d'un onglet Google Sheets
export interface SheetRow {
  [key: string]: string | undefined;
}

// Données d'un onglet avec son nom
export interface SheetTabData {
  tabName: string;
  rows: SheetRow[];
}

// Liste des onglets à lire (V2 - restructuré)
export const SHEET_TABS = [
  'Melun',
  'Dammarie-Les-Lys',
  'Exterieur',
] as const;

export type SheetTabName = typeof SHEET_TABS[number];
