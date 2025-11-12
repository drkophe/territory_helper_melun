/**
 * Logique de calcul du statut d'un territoire
 */

import type { TerritorySheetRow, TerritoryStatus } from './types';

/**
 * Calcule le statut d'un territoire en fonction des données Google Sheets
 *
 * Règles :
 * - assigned : Territoire attribué (givenAt renseigné) ET pas encore rendu (pas de returnedAt)
 * - available : Territoire rendu (returnedAt renseigné) OU jamais attribué
 * - unknown : Données manquantes ou ambiguës
 */
export function computeTerritoryStatus(row: TerritorySheetRow): TerritoryStatus {
  const hasGivenAt = Boolean(row.givenAt?.trim());
  const hasReturnedAt = Boolean(row.returnedAt?.trim());

  // Cas 1 : Attribué mais pas encore rendu
  if (hasGivenAt && !hasReturnedAt) {
    return 'assigned';
  }

  // Cas 2 : Rendu (avec ou sans attribution précédente)
  if (hasReturnedAt) {
    return 'available';
  }

  // Cas 3 : Ni attribué ni rendu = disponible
  if (!hasGivenAt && !hasReturnedAt) {
    return 'available';
  }

  // Cas par défaut (ne devrait jamais arriver avec la logique ci-dessus)
  return 'unknown';
}
