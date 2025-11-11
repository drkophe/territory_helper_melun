/**
 * Types pour la carte
 */

import type { LatLngExpression } from 'leaflet';

// Configuration de la carte
export interface MapConfig {
  center: LatLngExpression;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
}

// Style des territoires
export interface TerritoryStyle {
  color: string;           // Couleur de la bordure
  fillColor: string;       // Couleur de remplissage
  fillOpacity: number;     // Opacité du remplissage (0-1)
  weight: number;          // Épaisseur de la bordure
}

// Style des territoires au hover
export interface TerritoryHoverStyle extends TerritoryStyle {
  fillOpacity: number;
}

// Configuration des tuiles de carte
export interface TileLayerConfig {
  url: string;
  attribution: string;
  maxZoom?: number;
}
