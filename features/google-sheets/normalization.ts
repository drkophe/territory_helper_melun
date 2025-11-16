/**
 * Fonctions de normalisation pour le mapping Sheets ⇆ KML
 */

/**
 * Table de mapping des en-têtes de colonnes vers les propriétés TypeScript
 * Supporte plusieurs variantes de noms de colonnes
 */
export const HEADER_MAP: Record<string, string> = {
  // Code/Numéro du territoire (clé de jointure)
  'num.': 'code',
  'num': 'code',
  'n°': 'code',
  'numero': 'code',
  'code': 'code',

  // Ville
  'ville': 'city',

  // Nom complet
  'identité': 'fullName',
  'identite': 'fullName',
  'nom & prénom': 'fullName',
  'nom et prénom': 'fullName',
  'nom prenom': 'fullName',
  'nom': 'fullName',

  // Prénom seul
  'prénom': 'firstName',
  'prenom': 'firstName',

  // Dates
  'donné': 'givenAt',
  'donné :': 'givenAt',
  'donne': 'givenAt',
  'donne :': 'givenAt',
  'remis le': 'givenAt',
  'remis': 'givenAt',

  'contacter :': 'contactAt',
  'contacter': 'contactAt',
  'contacté le': 'contactAt',
  'contacte le': 'contactAt',
  'contacté :': 'contactAt',
  'contacte :': 'contactAt',

  'limite': 'limitAt',
  'limite :': 'limitAt',

  'rendu': 'returnedAt',
  'rendu :': 'returnedAt',
  'rendu le': 'returnedAt',

  // Textes
  'commentaire': 'comment',
  'information': 'info',
  'info': 'info',

  // Sortie (après normalisation, "Sortie 23/24" devient "sortie 2324")
  'sortie 2324': 'sortieFlag',
  'sortie 2425': 'sortieFlag',
  'sortie': 'sortieFlag',

  // Campagne
  'campagne': 'campaign',

  // Classeur
  'classeur': 'folder',
} as const;

/**
 * Normalise une clé d'en-tête pour le mapping
 * - Minuscules
 * - Trim des espaces
 * - Suppression des caractères spéciaux
 * - Trim final pour enlever les espaces résiduels
 */
export function normalizeHeaderKey(raw: string): string {
  return (raw ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.:;/\\]/g, '')
    .trim(); // IMPORTANT : trim final pour enlever l'espace après avoir retiré ":"
}

/**
 * Vérifie si un en-tête est une colonne parasite à ignorer
 * - Colonnes vides
 * - Colonnes "Colonne 1", "Colonne 2", etc.
 * - Dates ISO (2025-01-04, 04/01/25, etc.)
 */
export function isNoiseHeader(header: string): boolean {
  const s = (header ?? '').toLowerCase().trim();

  // Vide
  if (!s) return true;

  // "Colonne N"
  if (/^colonne\s+\d+$/i.test(s)) return true;

  // Date ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return true;

  // Date format DD/MM/YY
  if (/^\d{2}\/\d{2}\/\d{2,4}$/.test(s)) return true;

  return false;
}

/**
 * Construit un tableau de mapping des en-têtes vers les propriétés
 * @param headerRow Première ligne du Sheet (en-têtes bruts)
 * @returns Tableau où chaque élément est soit une propriété, soit "ignore"
 */
export function buildHeaderMapping(headerRow: string[]): Array<string | 'ignore'> {
  return headerRow.map((header) => {
    if (isNoiseHeader(header)) {
      return 'ignore';
    }

    const normalized = normalizeHeaderKey(header);
    const mapped = HEADER_MAP[normalized];

    if (mapped) {
      return mapped;
    }

    // Header non reconnu
    console.warn(`⚠️ En-tête non reconnu: "${header}" (normalisé: "${normalized}")`);
    return 'ignore';
  });
}

/**
 * Normalise un code de territoire pour le matching
 * - Uppercase
 * - Suppression des espaces
 * - Suppression des tirets et underscores
 *
 * Exemples:
 * - "M-001" → "M001"
 * - "dll 023" → "DLL023"
 * - "ext_b_12" → "EXTB12"
 */
export function normalizeTerritoryCode(raw: string | undefined): string {
  if (!raw) return '';

  return raw
    .toString()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '');
}
