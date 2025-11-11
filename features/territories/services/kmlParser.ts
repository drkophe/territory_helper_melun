/**
 * Service de parsing KML vers GeoJSON
 */

import { DOMParser } from '@xmldom/xmldom';
import * as toGeoJSON from '@mapbox/togeojson';
import type { TerritoryCollection, TerritoryFeature } from '../types';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Parse un fichier KML et retourne une collection GeoJSON de territoires
 */
export async function parseKMLFile(kmlPath: string): Promise<TerritoryCollection> {
  try {
    // Lire le fichier KML
    const kmlContent = await readFile(kmlPath, 'utf-8');

    // Parser le XML
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlContent, 'text/xml');

    // Convertir en GeoJSON
    const geoJson = toGeoJSON.kml(kmlDoc);

    // Enrichir les features avec les métadonnées extraites du KML
    const enrichedFeatures = geoJson.features.map((feature, index) => {
      // Extraire le dossier parent (Folder) du KML
      const folder = extractFolderName(kmlDoc, feature.properties?.name);

      return {
        ...feature,
        id: feature.id || index,
        properties: {
          ...feature.properties,
          folder,
        },
      } as TerritoryFeature;
    });

    return {
      type: 'FeatureCollection',
      features: enrichedFeatures,
    } as TerritoryCollection;
  } catch (error) {
    console.error('Error parsing KML:', error);
    throw new Error('Failed to parse KML file');
  }
}

/**
 * Extrait le nom du dossier parent (ville) d'un territoire
 */
function extractFolderName(kmlDoc: Document, territoryName?: string): string | undefined {
  if (!territoryName) return undefined;

  try {
    // Chercher le Placemark avec ce nom
    const placemarks = kmlDoc.getElementsByTagName('Placemark');

    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const nameElement = placemark.getElementsByTagName('name')[0];

      if (nameElement?.textContent === territoryName) {
        // Remonter au parent Folder
        let parent = placemark.parentNode;
        while (parent && parent.nodeName !== 'Folder') {
          parent = parent.parentNode;
        }

        if (parent) {
          const folderNameElement = parent.getElementsByTagName('name')[0];
          return folderNameElement?.textContent || undefined;
        }
      }
    }
  } catch (error) {
    console.error('Error extracting folder name:', error);
  }

  return undefined;
}

/**
 * Charge les territoires depuis le fichier KML public
 */
export async function loadTerritories(): Promise<TerritoryCollection> {
  const kmlPath = join(process.cwd(), 'public', 'territoires.kml');
  return parseKMLFile(kmlPath);
}
