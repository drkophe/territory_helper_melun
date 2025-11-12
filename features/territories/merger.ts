/**
 * Fusion des données KML et Google Sheets
 */

import type { TerritoryCollection, TerritoryFeature, EnrichedTerritoryProperties, TerritorySheetRow } from './types';
import { computeTerritoryStatus } from './status';

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
  // Créer une map pour lookup rapide par code de territoire
  const sheetsMap = new Map<string, TerritorySheetRow>();
  sheetsData.forEach((row) => {
    sheetsMap.set(row.code, row);
  });

  // Enrichir chaque feature KML
  const enrichedFeatures = kmlCollection.features.map((feature): TerritoryFeature => {
    const territoryName = feature.properties.name;
    const sheetData = sheetsMap.get(territoryName);

    if (sheetData) {
      // Territoire trouvé dans Sheets : enrichir avec toutes les données
      const status = computeTerritoryStatus(sheetData);

      const enrichedProperties: EnrichedTerritoryProperties = {
        ...feature.properties,
        ...sheetData,
        status,
        code: sheetData.code,
        city: sheetData.city,
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
        code: territoryName,
        city: feature.properties.folder || 'Inconnu',
        sheetName: 'N/A',
      };

      return {
        ...feature,
        properties: enrichedProperties,
      };
    }
  });

  return {
    type: 'FeatureCollection',
    features: enrichedFeatures,
  };
}
