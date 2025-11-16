/**
 * Configuration de la carte
 */

import type { MapConfig, TileLayerConfig, TerritoryStyle, TerritoryHoverStyle } from './types';

// Configuration de la carte centrée sur Melun
export const MAP_CONFIG: MapConfig = {
  center: [48.5333, 2.6667], // Coordonnées de Melun
  zoom: 12,
  minZoom: 10,
  maxZoom: 18,
};

// Configuration des tuiles OpenStreetMap
// Choix: OpenStreetMap standard - gratuit, clair, modulable
export const TILE_LAYER_CONFIG: TileLayerConfig = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

// Style par défaut des territoires
// Ces valeurs peuvent être facilement modifiées pour changer l'apparence
export const DEFAULT_TERRITORY_STYLE: TerritoryStyle = {
  color: '#3388ff',        // Bleu pour la bordure
  fillColor: '#3388ff',    // Bleu pour le remplissage
  fillOpacity: 0.2,        // 20% d'opacité - transparent mais visible
  weight: 2,               // Épaisseur de la bordure
};

// Style au survol
export const HOVER_TERRITORY_STYLE: TerritoryHoverStyle = {
  ...DEFAULT_TERRITORY_STYLE,
  fillOpacity: 0.4,        // Plus opaque au hover
  weight: 3,               // Bordure plus épaisse
};

// Style du territoire sélectionné
export const SELECTED_TERRITORY_STYLE: TerritoryStyle = {
  color: '#ff6b35',        // Orange pour la bordure
  fillColor: '#ff6b35',    // Orange pour le remplissage
  fillOpacity: 0.3,        // 30% d'opacité
  weight: 3,               // Bordure épaisse
};

// Couleurs par statut (Sprint 2 - Google Sheets)
// Nouvelle logique métier :
// - assigned (indisponible) = gris
// - available = vert avec nuances selon priorité
export const STATUS_COLORS = {
  assigned: '#6b7280',           // Gris - Indisponible (attribué)
  unknown: '#94a3b8',            // Gris clair - Inconnu
  // Nuances de vert pour les disponibles selon priorité
  availableHigh: '#22c55e',      // Vert vif - Très disponible (>365j ou jamais sorti)
  availableMedium: '#84cc16',    // Vert moyen - Moyennement disponible (180-365j)
  availableLow: '#a3a3a3',       // Gris-vert - Peu disponible (<180j, sorti récemment)
} as const;

/**
 * Retourne un style de territoire en fonction de son statut et de sa priorité
 */
export function getStyleByStatus(
  status: 'available' | 'assigned' | 'unknown',
  availabilityPriority?: 'high' | 'medium' | 'low'
): TerritoryStyle {
  let color: string;

  if (status === 'assigned') {
    color = STATUS_COLORS.assigned; // Gris pour indisponible
  } else if (status === 'available') {
    // Nuances de vert selon la priorité
    switch (availabilityPriority) {
      case 'high':
        color = STATUS_COLORS.availableHigh; // Vert vif
        break;
      case 'medium':
        color = STATUS_COLORS.availableMedium; // Vert moyen
        break;
      case 'low':
        color = STATUS_COLORS.availableLow; // Gris-vert
        break;
      default:
        color = STATUS_COLORS.availableHigh; // Par défaut très disponible
    }
  } else {
    color = STATUS_COLORS.unknown; // Gris clair pour inconnu
  }

  return {
    color,
    fillColor: color,
    fillOpacity: 0.3,
    weight: 2,
  };
}
