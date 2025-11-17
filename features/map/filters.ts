/**
 * Fonctions de filtrage des territoires
 */

import type { EnrichedTerritoryProperties } from '@/features/territories/types';
import type { AgeFilter, StatusFilter } from './components/FiltersPanel';
import { DAYS_2_MONTHS, DAYS_4_MONTHS, DAYS_6_MONTHS, DAYS_8_MONTHS, DAYS_10_MONTHS } from './config';

/**
 * Code normalisé du territoire représentant la limite globale
 * Note: Les parenthèses sont conservées par normalizeTerritoryCode()
 */
const BOUNDARY_CODE = '(770131)MELUN';

/**
 * Filtre par statut (disponible/attribué/tous)
 */
export function matchesStatusFilter(
  props: EnrichedTerritoryProperties,
  statusFilter: StatusFilter
): boolean {
  switch (statusFilter) {
    case 'available':
      return props.status === 'available';
    case 'assigned':
      return props.status === 'assigned';
    case 'all':
    default:
      return true;
  }
}

/**
 * Filtre par ancienneté (uniquement pour les territoires disponibles)
 */
export function matchesAgeFilter(
  props: EnrichedTerritoryProperties,
  ageFilter: AgeFilter
): boolean {
  // Le filtre d'âge ne s'applique qu'aux disponibles
  if (props.status !== 'available') return true;

  const days = props.daysSinceLastReturn;
  if (days === undefined || days === null) return false;

  switch (ageFilter) {
    case 'gt_10m':
      return days > DAYS_10_MONTHS;
    case 'gt_8m':
      return days > DAYS_8_MONTHS;
    case 'gt_6m':
      return days > DAYS_6_MONTHS;
    case 'gt_4m':
      return days > DAYS_4_MONTHS;
    case 'gt_2m':
      return days > DAYS_2_MONTHS;
    case 'all':
    default:
      return true;
  }
}

/**
 * Filtre pour masquer le territoire limite globale
 */
export function matchesBoundaryFilter(
  props: EnrichedTerritoryProperties,
  hideBoundary: boolean
): boolean {
  if (!hideBoundary) return true;

  // Log pour diagnostic (désactiver en production)
  if (props.code === BOUNDARY_CODE) {
    console.log('🚧 Territoire limite détecté:', { code: props.code, hideBoundary, filtered: true });
  }

  return props.code !== BOUNDARY_CODE;
}

/**
 * Applique tous les filtres combinés
 */
export function applyFilters(
  props: EnrichedTerritoryProperties,
  statusFilter: StatusFilter,
  ageFilter: AgeFilter,
  hideBoundary: boolean
): boolean {
  return (
    matchesStatusFilter(props, statusFilter) &&
    matchesAgeFilter(props, ageFilter) &&
    matchesBoundaryFilter(props, hideBoundary)
  );
}
