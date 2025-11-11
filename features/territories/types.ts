/**
 * Types pour les territoires
 */

import type { Feature, Polygon, MultiPolygon, FeatureCollection } from 'geojson';

// Propriétés d'un territoire extraites du KML
export interface TerritoryProperties {
  name: string;              // Nom du territoire (ex: "DLL 001")
  description?: string;       // Description éventuelle
  folder?: string;           // Dossier parent (ville, ex: "Dammarie-Les-Lys")
  styleUrl?: string;         // Style KML
  [key: string]: unknown;    // Autres propriétés KML
}

// Feature GeoJSON d'un territoire
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
