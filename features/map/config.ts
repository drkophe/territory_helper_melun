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
// Gradient continu de violets selon ancienneté pour les disponibles
export const STATUS_COLORS = {
  assigned: '#808080',           // Gris - Indisponible (attribué)
  unknown: '#CCCCCC',            // Gris clair - Inconnu
  // Gradient de violets pour les disponibles (du plus récent au plus ancien)
  availableNewest: '#D78FEE',    // 0% - Rendu récemment (moins prioritaire)
  availableMiddle: '#9B5DE0',    // 50% - Milieu
  availableOldest: '#4E56C0',    // 100% - Très ancien (très prioritaire)
} as const;

/**
 * Convertit un code hex en RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

/**
 * Convertit RGB en hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => Math.round(x).toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Interpolation linéaire
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpole entre deux couleurs hex
 */
function interpolateColor(fromHex: string, toHex: string, t: number): string {
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);
  const r = lerp(from.r, to.r, t);
  const g = lerp(from.g, to.g, t);
  const b = lerp(from.b, to.b, t);
  return rgbToHex(r, g, b);
}

/**
 * Retourne une couleur du gradient violet selon un ratio [0,1]
 * - 0 = plus récent (violet clair #D78FEE)
 * - 0.5 = milieu (#9B5DE0)
 * - 1 = plus ancien (violet foncé #4E56C0)
 */
export function getGradientColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));

  if (clamped <= 0.5) {
    // De récent (0) vers milieu (0.5)
    const localT = clamped / 0.5; // Normaliser à [0,1]
    return interpolateColor(STATUS_COLORS.availableNewest, STATUS_COLORS.availableMiddle, localT);
  } else {
    // De milieu (0.5) vers très ancien (1)
    const localT = (clamped - 0.5) / 0.5; // Normaliser à [0,1]
    return interpolateColor(STATUS_COLORS.availableMiddle, STATUS_COLORS.availableOldest, localT);
  }
}

/**
 * Calcule le ratio [0,1] basé sur daysSince
 * - 0 = minDays (plus récent)
 * - 1 = maxDays (plus ancien)
 */
export function computeDaysRatio(days: number, minDays: number, maxDays: number): number {
  if (maxDays <= minDays) {
    return 1; // Tous pareils → considérés comme très anciens
  }
  const t = (days - minDays) / (maxDays - minDays);
  return Math.min(1, Math.max(0, t));
}

/**
 * Retourne un style de territoire basé sur le statut et daysSince (gradient continu)
 */
export function getStyleByStatus(
  status: 'available' | 'assigned' | 'unknown',
  daysSince?: number,
  minDays?: number,
  maxDays?: number
): TerritoryStyle {
  let color: string;

  if (status === 'assigned') {
    color = STATUS_COLORS.assigned; // Gris pour indisponible
  } else if (status === 'available') {
    // Gradient de violet selon l'ancienneté
    if (daysSince !== undefined && minDays !== undefined && maxDays !== undefined) {
      const ratio = computeDaysRatio(daysSince, minDays, maxDays);
      color = getGradientColor(ratio);
    } else {
      // Pas de date → milieu par défaut
      color = STATUS_COLORS.availableMiddle;
    }
  } else {
    color = STATUS_COLORS.unknown; // Gris clair pour inconnu
  }

  return {
    color,
    fillColor: color,
    fillOpacity: 0.5,
    weight: 2,
  };
}
