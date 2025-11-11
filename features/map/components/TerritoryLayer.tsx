'use client';

/**
 * Couche de territoires sur la carte
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { TerritoryCollection, TerritoryFeature, SelectedTerritory } from '@/features/territories/types';
import {
  DEFAULT_TERRITORY_STYLE,
  HOVER_TERRITORY_STYLE,
  SELECTED_TERRITORY_STYLE
} from '../config';

interface TerritoryLayerProps {
  map: L.Map;
  territories: TerritoryCollection;
  selectedTerritory?: SelectedTerritory | null;
  onTerritoryClick?: (territory: SelectedTerritory) => void;
}

export default function TerritoryLayer({
  map,
  territories,
  selectedTerritory,
  onTerritoryClick,
}: TerritoryLayerProps) {
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map || !territories) return;

    // Créer un groupe de couches
    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    // Ajouter chaque territoire
    territories.features.forEach((feature: TerritoryFeature) => {
      const geoJsonLayer = L.geoJSON(feature, {
        style: (feature) => {
          // Style sélectionné si c'est le territoire actuel
          if (selectedTerritory && feature?.properties?.name === selectedTerritory.name) {
            return SELECTED_TERRITORY_STYLE;
          }
          return DEFAULT_TERRITORY_STYLE;
        },
        onEachFeature: (feature, layer) => {
          // Événements de souris
          layer.on({
            mouseover: (e) => {
              const layer = e.target;
              if (!selectedTerritory || feature.properties?.name !== selectedTerritory.name) {
                layer.setStyle(HOVER_TERRITORY_STYLE);
              }
            },
            mouseout: (e) => {
              const layer = e.target;
              if (!selectedTerritory || feature.properties?.name !== selectedTerritory.name) {
                layer.setStyle(DEFAULT_TERRITORY_STYLE);
              } else {
                layer.setStyle(SELECTED_TERRITORY_STYLE);
              }
            },
            click: () => {
              if (onTerritoryClick && feature.properties) {
                onTerritoryClick({
                  id: feature.id || feature.properties.name,
                  name: feature.properties.name,
                  folder: feature.properties.folder,
                  properties: feature.properties,
                });
              }
            },
          });

          // Tooltip au survol
          if (feature.properties?.name) {
            layer.bindTooltip(feature.properties.name, {
              permanent: false,
              direction: 'top',
            });
          }
        },
      });

      geoJsonLayer.addTo(layerGroup);
    });

    // Ajuster la vue pour voir tous les territoires
    const bounds = layerGroup.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Cleanup
    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        layerGroupRef.current.remove();
      }
    };
  }, [map, territories, selectedTerritory, onTerritoryClick]);

  // Re-styler les couches quand le territoire sélectionné change
  useEffect(() => {
    if (!layerGroupRef.current) return;

    layerGroupRef.current.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) {
        layer.eachLayer((subLayer) => {
          if (subLayer instanceof L.Path) {
            const feature = (subLayer as L.Path & { feature?: TerritoryFeature }).feature;
            if (feature?.properties) {
              if (selectedTerritory && feature.properties.name === selectedTerritory.name) {
                subLayer.setStyle(SELECTED_TERRITORY_STYLE);
              } else {
                subLayer.setStyle(DEFAULT_TERRITORY_STYLE);
              }
            }
          }
        });
      }
    });
  }, [selectedTerritory]);

  return null; // Ce composant ne rend rien visuellement
}
