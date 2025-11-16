/**
 * Logique de calcul du statut d'un territoire
 */

import type { TerritorySheetRow, TerritoryStatus } from './types';

/**
 * Priorité de disponibilité d'un territoire disponible
 * Basée sur l'ancienneté de la dernière sortie
 */
export type AvailabilityPriority = 'high' | 'medium' | 'low';

/**
 * Calcule le statut d'un territoire en fonction des données Google Sheets
 *
 * Nouvelle règle métier :
 * - assigned (indisponible) : a un nom dans Identité OU une date dans Donné :
 * - available : pas de nom ET pas de Donné :
 * - unknown : aucune info (ligne bizarre)
 */
export function computeTerritoryStatus(row: TerritorySheetRow): TerritoryStatus {
  const hasFullName = Boolean(row.fullName?.trim());
  const hasGivenAt = Boolean(row.givenAt?.trim());

  // Territoire indisponible = nom OU date de don
  if (hasFullName || hasGivenAt) {
    return 'assigned';
  }

  // Territoire disponible = ni nom ni date de don
  if (!hasFullName && !hasGivenAt) {
    return 'available';
  }

  // Cas par défaut (ne devrait jamais arriver)
  return 'unknown';
}

/**
 * Parse une date au format français (DD/MM/YY ou DD/MM/YYYY)
 * Retourne undefined si le parsing échoue ou si la date est dans le futur
 */
function parseFrenchDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;

  const trimmed = dateStr.trim();
  if (!trimmed) return undefined;

  // Format attendu : DD/MM/YY ou DD/MM/YYYY
  const parts = trimmed.split('/');
  if (parts.length !== 3) return undefined;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Les mois JS commencent à 0
  let year = parseInt(parts[2], 10);

  // Si année sur 2 chiffres, on suppose 20XX pour 00-50 et 19XX pour 51-99
  if (year < 100) {
    year += year <= 50 ? 2000 : 1900;
  }

  const date = new Date(year, month, day);

  // Vérifier que la date est valide
  if (isNaN(date.getTime())) return undefined;

  // Rejeter les dates dans le futur (erreur de saisie probable)
  const today = new Date();
  if (date.getTime() > today.getTime()) {
    console.warn(`⚠️ Date dans le futur ignorée: ${dateStr} → ${date.toLocaleDateString('fr-FR')}`);
    return undefined;
  }

  return date;
}

/**
 * Calcule le nombre de jours depuis une date
 */
function daysSince(date: Date | undefined): number | undefined {
  if (!date) return undefined;

  const today = new Date();
  const diffMs = today.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calcule la priorité de disponibilité d'un territoire disponible
 * Basée sur la date de dernier retour (Rendu :)
 *
 * Règles :
 * - Pas de date de retour → très prioritaire (jamais sorti ou info manquante) → "high"
 * - > 365 jours depuis le retour → très prioritaire (pas sorti depuis longtemps) → "high"
 * - Entre 180 et 365 jours → priorité moyenne → "medium"
 * - < 180 jours → faible priorité (sorti récemment) → "low"
 */
export function computeAvailabilityPriority(
  row: TerritorySheetRow | undefined
): AvailabilityPriority | undefined {
  if (!row) return undefined;

  // Si pas de date de retour, c'est très disponible
  if (!row.returnedAt) {
    return 'high';
  }

  const returnedDate = parseFrenchDate(row.returnedAt);
  const days = daysSince(returnedDate);

  if (days === undefined) {
    // Impossible de parser la date, on considère comme prioritaire par défaut
    return 'high';
  }

  // Seuils de priorité
  if (days > 365) return 'high';    // Pas sorti depuis plus d'un an
  if (days > 180) return 'medium';  // Entre 6 mois et 1 an
  return 'low';                     // Sorti il y a moins de 6 mois
}

/**
 * Calcule le nombre de jours depuis le dernier retour
 */
export function computeDaysSinceLastReturn(
  row: TerritorySheetRow | undefined
): number | undefined {
  if (!row?.returnedAt) return undefined;

  const returnedDate = parseFrenchDate(row.returnedAt);
  return daysSince(returnedDate);
}
