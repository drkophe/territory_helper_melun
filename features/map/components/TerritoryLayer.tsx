'use client';

/**
 * Couche de territoires sur la carte
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { TerritoryCollection, TerritoryFeature, SelectedTerritory, EnrichedTerritoryProperties } from '@/features/territories/types';
import {
  DEFAULT_TERRITORY_STYLE,
  HOVER_TERRITORY_STYLE,
  SELECTED_TERRITORY_STYLE,
  getStyleByStatus
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
  const isInitialLoad = useRef(true);

  useEffect(() => {
    console.log('🗺️ TerritoryLayer - useEffect appelé');
    console.log('   Map:', !!map);
    console.log('   Territories:', territories?.features?.length || 0);

    if (!map || !territories) {
      console.log('⚠️ TerritoryLayer - Sortie (pas de map ou territories)');
      return;
    }

    console.log('✨ TerritoryLayer - Création des couches pour', territories.features.length, 'territoires');

    // Créer un groupe de couches (featureGroup permet getBounds)
    const layerGroup = L.featureGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    // Ajouter chaque territoire
    territories.features.forEach((feature: TerritoryFeature, index) => {
      if (index === 0) {
        console.log('📍 Premier territoire:', feature.properties.name);
      }
      const geoJsonLayer = L.geoJSON(feature, {
        style: (feature) => {
          // Style sélectionné si c'est le territoire actuel
          if (selectedTerritory && feature?.properties?.name === selectedTerritory.name) {
            return SELECTED_TERRITORY_STYLE;
          }

          // Style selon le statut et la priorité (Sprint 2 - Google Sheets)
          const props = feature?.properties as Partial<EnrichedTerritoryProperties>;
          if (props?.status) {
            return getStyleByStatus(props.status, props.availabilityPriority);
          }

          // Fallback sur le style par défaut (Sprint 1)
          return DEFAULT_TERRITORY_STYLE;
        },
        onEachFeature: (feature, layer) => {
          // Événements de souris
          layer.on({
            mouseover: (e) => {
              const layer = e.target;
              if (!selectedTerritory || feature.properties?.name !== selectedTerritory.name) {
                // Appliquer un hover qui garde la couleur de base mais augmente l'opacité
                const props = feature.properties as Partial<EnrichedTerritoryProperties>;
                if (props?.status) {
                  const baseStyle = getStyleByStatus(props.status, props.availabilityPriority);
                  layer.setStyle({
                    ...baseStyle,
                    fillOpacity: 0.5,
                    weight: 3,
                  });
                } else {
                  layer.setStyle(HOVER_TERRITORY_STYLE);
                }
              }
            },
            mouseout: (e) => {
              const layer = e.target;
              if (!selectedTerritory || feature.properties?.name !== selectedTerritory.name) {
                // Restaurer le style basé sur le statut et la priorité
                const props = feature.properties as Partial<EnrichedTerritoryProperties>;
                if (props?.status) {
                  layer.setStyle(getStyleByStatus(props.status, props.availabilityPriority));
                } else {
                  layer.setStyle(DEFAULT_TERRITORY_STYLE);
                }
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

    console.log('✅ Territoires ajoutés au layerGroup');

    // Ajuster la vue pour voir tous les territoires UNIQUEMENT au premier chargement
    const bounds = layerGroup.getBounds();
    console.log('📏 Bounds valides:', bounds.isValid());
    if (bounds.isValid() && isInitialLoad.current) {
      console.log('🔍 fitBounds appelé (premier chargement):', bounds);
      map.fitBounds(bounds, { padding: [50, 50] });
      isInitialLoad.current = false;
    }

    // Cleanup
    return () => {
      console.log('🧹 TerritoryLayer - Cleanup');
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
                // Utiliser le style basé sur le statut et la priorité (Sprint 2)
                const props = feature.properties as Partial<EnrichedTerritoryProperties>;
                if (props?.status) {
                  subLayer.setStyle(getStyleByStatus(props.status, props.availabilityPriority));
                } else {
                  subLayer.setStyle(DEFAULT_TERRITORY_STYLE);
                }
              }
            }
          }
        });
      }
    });
  }, [selectedTerritory]);

  return null; // Ce composant ne rend rien visuellement
}
