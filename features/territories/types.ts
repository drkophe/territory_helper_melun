/**
 * Types pour les territoires
 */

import type { Feature, Polygon, MultiPolygon, FeatureCollection } from 'geojson';

// Statut métier d'un territoire
export type TerritoryStatus = 'available' | 'assigned' | 'unknown';

// Données brutes d'une ligne Google Sheets pour un territoire
export interface TerritorySheetRow {
  city: string;           // Ville (déduit du nom de l'onglet)
  code: string;           // Code territoire (Num.)
  fullName?: string;      // Nom & Prénom / Identité
  firstName?: string;     // Prénom
  givenAt?: string;       // Remis le / Donné
  contactAt?: string;     // Contacté le / Contacter
  limitAt?: string;       // Limite
  returnedAt?: string;    // Rendu le / Rendu
  comment?: string;       // Commentaire
  info?: string;          // Info / Information
  sortieFlag?: string;    // Sortie (O/N)
  campaign?: string;      // Campagne
  folder?: string;        // Classeur
  sheetName: string;      // Nom de l'onglet source
}

// Propriétés d'un territoire (KML de base)
export interface BaseTerritoryProperties {
  name: string;              // Nom du territoire (ex: "DLL 001")
  description?: string;       // Description éventuelle
  folder?: string;           // Dossier parent (ville, ex: "Dammarie-Les-Lys")
  styleUrl?: string;         // Style KML
  [key: string]: unknown;    // Autres propriétés KML
}

// Propriétés enrichies d'un territoire (KML + Sheets + statut)
export interface EnrichedTerritoryProperties extends BaseTerritoryProperties, Partial<TerritorySheetRow> {
  status: TerritoryStatus;
  code: string;
  city: string;
}

// Feature GeoJSON d'un territoire (compatible Sprint 1 ET Sprint 2)
export type TerritoryProperties = BaseTerritoryProperties | EnrichedTerritoryProperties;
export type TerritoryFeature = Feature<Polygon | MultiPolygon, TerritoryProperties>;

// Collection de territoires
export type TerritoryCollection = FeatureCollection<Polygon | MultiPolygon, TerritoryProperties>;

// Type pour un territoire sélectionné (avec ses propriétés)
export interface SelectedTerritory {
  id: string | number;
  name: string;
  folder?: string;
  properties: TerritoryProperties;
}
