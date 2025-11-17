/**
 * Client API pour les opérations sur les territoires
 */

import type { AssignTerritoryPayload, ReturnTerritoryPayload } from '@/features/google-sheets/writer-types';
import type { EnrichedTerritoryProperties } from '../types';

interface ApiResponse<T> {
  success: boolean;
  territory?: T;
  error?: string;
  details?: any;
}

/**
 * Attribue un territoire
 */
export async function assignTerritoryApi(
  payload: AssignTerritoryPayload
): Promise<EnrichedTerritoryProperties> {
  const response = await fetch('/api/territories/assign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data: ApiResponse<EnrichedTerritoryProperties> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erreur lors de l\'attribution');
  }

  if (!data.territory) {
    throw new Error('Aucune donnée retournée');
  }

  return data.territory;
}

/**
 * Marque un territoire comme rendu
 */
export async function returnTerritoryApi(
  payload: ReturnTerritoryPayload
): Promise<EnrichedTerritoryProperties> {
  const response = await fetch('/api/territories/return', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data: ApiResponse<EnrichedTerritoryProperties> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erreur lors du retour');
  }

  if (!data.territory) {
    throw new Error('Aucune donnée retournée');
  }

  return data.territory;
}

/**
 * Rafraîchit l'index des territoires
 */
export async function refreshIndexApi(): Promise<void> {
  const response = await fetch('/api/territories/refresh', {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erreur lors du rafraîchissement');
  }
}
