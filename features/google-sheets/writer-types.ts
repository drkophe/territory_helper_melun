/**
 * Types pour l'écriture dans Google Sheets
 */

import { z } from 'zod';

/**
 * Payload pour attribuer un territoire
 */
export const AssignTerritorySchema = z.object({
  code: z.string().min(1, 'Le code du territoire est requis'),
  fullName: z.string().min(1, 'Le nom complet est requis'),
  firstName: z.string().optional(),
  givenAt: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format de date invalide (JJ/MM/AAAA)'),
  contactAt: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
  limitAt: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
  comment: z.string().optional(),
});

export type AssignTerritoryPayload = z.infer<typeof AssignTerritorySchema>;

/**
 * Payload pour marquer un territoire comme rendu
 */
export const ReturnTerritorySchema = z.object({
  code: z.string().min(1, 'Le code du territoire est requis'),
  returnedAt: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Format de date invalide (JJ/MM/AAAA)'),
  comment: z.string().optional(),
  clearAssignment: z.boolean().default(true), // Vider Identité, Donné, etc.
});

export type ReturnTerritoryPayload = z.infer<typeof ReturnTerritorySchema>;

/**
 * Position d'un territoire dans les feuilles Google Sheets
 */
export interface TerritoryPosition {
  sheetName: string;
  rowIndex: number; // Index 1-based (ligne 1 = en-tête)
}

/**
 * Index global code → position
 */
export type TerritoryIndex = Map<string, TerritoryPosition>;

/**
 * Résultat d'une opération d'écriture
 */
export interface WriteResult {
  success: boolean;
  territory?: EnrichedTerritoryProperties;
  error?: string;
}

// Import du type Territory enrichi
import type { EnrichedTerritoryProperties } from '../territories/types';
