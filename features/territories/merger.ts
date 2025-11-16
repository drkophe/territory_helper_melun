/**
 * Fusion des données KML et Google Sheets
 * Version 2: Avec normalisation des codes pour matching robuste
 */

import type { TerritoryCollection, TerritoryFeature, EnrichedTerritoryProperties, TerritorySheetRow } from './types';
import { computeTerritoryStatus, computeAvailabilityPriority, computeDaysSinceLastReturn, type AvailabilityPriority } from './status';
import { normalizeTerritoryCode } from '@/features/google-sheets/normalization';
import { STATUS_COLORS } from '@/features/map/config';

/**
 * Enrichit une collection de territoires KML avec les données Google Sheets
 *
 * @param kmlCollection Collection GeoJSON issue du parsing KML
 * @param sheetsData Données des territoires depuis Google Sheets
 * @returns Collection enrichie avec statut et données Sheets
 */
export function enrichTerritoriesWithSheets(
  kmlCollection: TerritoryCollection,
  sheetsData: TerritorySheetRow[]
): TerritoryCollection {
  console.log(`📋 Merger: ${kmlCollection.features.length} territoires KML, ${sheetsData.length} lignes Sheets`);

  // Créer une map pour lookup rapide par code de territoire normalisé
  const sheetsMap = new Map<string, TerritorySheetRow>();
  sheetsData.forEach((row) => {
    sheetsMap.set(row.code, row); // Le code est déjà normalisé côté Sheets
  });

  console.log('🔑 Codes Sheets (20 premiers):', Array.from(sheetsMap.keys()).slice(0, 20));

  // Normaliser et logger les codes KML
  const kmlCodesNormalized = kmlCollection.features.slice(0, 20).map((f) => {
    const raw = f.properties.name;
    const normalized = normalizeTerritoryCode(raw);
    return `${raw} → ${normalized}`;
  });
  console.log('🔑 Codes KML normalisés (20 premiers):', kmlCodesNormalized);

  // Enrichir chaque feature KML
  let matchCount = 0;
  const enrichedFeatures = kmlCollection.features.map((feature): TerritoryFeature => {
    const territoryName = feature.properties.name;
    const normalizedCode = normalizeTerritoryCode(territoryName);
    const sheetData = sheetsMap.get(normalizedCode);

    if (sheetData) {
      matchCount++;

      // Territoire trouvé dans Sheets : enrichir avec toutes les données
      const status = computeTerritoryStatus(sheetData);

      // Calculer la priorité et les jours depuis le retour pour les territoires disponibles
      let daysSinceLastReturn: number | undefined;
      let availabilityPriority: AvailabilityPriority | undefined;

      if (status === 'available') {
        daysSinceLastReturn = computeDaysSinceLastReturn(sheetData);
        availabilityPriority = computeAvailabilityPriority(sheetData);
      }

      const enrichedProperties: EnrichedTerritoryProperties = {
        ...feature.properties,
        ...sheetData,
        status,
        code: normalizedCode, // Utiliser le code normalisé
        city: sheetData.city,
        daysSinceLastReturn,
        availabilityPriority,
      };

      return {
        ...feature,
        properties: enrichedProperties,
      };
    } else {
      // Territoire non trouvé dans Sheets : statut unknown
      const enrichedProperties: EnrichedTerritoryProperties = {
        ...feature.properties,
        status: 'unknown',
        code: normalizedCode, // Utiliser le code normalisé
        city: feature.properties.folder || 'Inconnu',
        sheetName: 'N/A',
      };

      return {
        ...feature,
        properties: enrichedProperties,
      };
    }
  });

  console.log(`✅ Merger: ${matchCount}/${kmlCollection.features.length} territoires matchés avec Sheets`);

  // Palette de couleurs utilisée
  console.log('🎨 Palette de couleurs:', {
    assigned: STATUS_COLORS.assigned,
    availableHigh: STATUS_COLORS.availableHigh + ' (>365j)',
    availableMedium: STATUS_COLORS.availableMedium + ' (180-365j)',
    availableLow: STATUS_COLORS.availableLow + ' (<180j)',
    unknown: STATUS_COLORS.unknown,
  });

  // Statistiques par statut
  const byStatus = {
    assigned: enrichedFeatures.filter((f) => (f.properties as EnrichedTerritoryProperties).status === 'assigned').length,
    available: enrichedFeatures.filter((f) => (f.properties as EnrichedTerritoryProperties).status === 'available').length,
    unknown: enrichedFeatures.filter((f) => (f.properties as EnrichedTerritoryProperties).status === 'unknown').length,
  };
  console.log('📊 Répartition par statut:', byStatus);

  // Exemples de territoires assigned (indisponibles)
  const assignedSamples = enrichedFeatures
    .filter((f) => (f.properties as EnrichedTerritoryProperties).status === 'assigned')
    .slice(0, 5)
    .map((f) => {
      const props = f.properties as EnrichedTerritoryProperties;
      return {
        code: props.code,
        fullName: props.fullName,
        givenAt: props.givenAt,
        returnedAt: props.returnedAt,
      };
    });

  if (assignedSamples.length > 0) {
    console.log('🔴 Exemples de territoires INDISPONIBLES (assigned) - 5 premiers:', assignedSamples);
  }

  // Exemples de territoires available avec priorités et couleurs
  const availableSamples = enrichedFeatures
    .filter((f) => (f.properties as EnrichedTerritoryProperties).status === 'available')
    .slice(0, 10)
    .map((f) => {
      const props = f.properties as EnrichedTerritoryProperties;

      // Déterminer la couleur selon la priorité
      let fillColor: string = STATUS_COLORS.availableHigh; // Par défaut
      if (props.availabilityPriority === 'high') {
        fillColor = STATUS_COLORS.availableHigh;
      } else if (props.availabilityPriority === 'medium') {
        fillColor = STATUS_COLORS.availableMedium;
      } else if (props.availabilityPriority === 'low') {
        fillColor = STATUS_COLORS.availableLow;
      }

      return {
        code: props.code,
        returnedAt: props.returnedAt,
        daysSince: props.daysSinceLastReturn,
        priority: props.availabilityPriority,
        fillColor,
      };
    });

  if (availableSamples.length > 0) {
    console.log('🟢 Exemples de territoires DISPONIBLES (available) - 10 premiers:', availableSamples);
  }

  // Répartition par priorité pour les disponibles
  const byPriority = {
    high: enrichedFeatures.filter((f) => (f.properties as EnrichedTerritoryProperties).availabilityPriority === 'high').length,
    medium: enrichedFeatures.filter((f) => (f.properties as EnrichedTerritoryProperties).availabilityPriority === 'medium').length,
    low: enrichedFeatures.filter((f) => (f.properties as EnrichedTerritoryProperties).availabilityPriority === 'low').length,
  };
  console.log('🎯 Répartition des disponibles par priorité:', byPriority);

  // Afficher quelques exemples de non-matchés pour diagnostic
  const unmatched = enrichedFeatures
    .filter((f) => (f.properties as EnrichedTerritoryProperties).status === 'unknown')
    .slice(0, 10)
    .map((f) => ({
      name: f.properties.name,
      code: (f.properties as EnrichedTerritoryProperties).code,
    }));

  if (unmatched.length > 0) {
    console.log('⚠️ Exemples de territoires non matchés (10 premiers):', unmatched);
  }

  return {
    type: 'FeatureCollection',
    features: enrichedFeatures,
  };
}
