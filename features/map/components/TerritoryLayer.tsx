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
  getStyleByStatus,
  type ColorMode
} from '../config';
import type { AgeFilter, StatusFilter } from './FiltersPanel';
import { applyFilters } from '../filters';

interface TerritoryLayerProps {
  map: L.Map;
  territories: TerritoryCollection;
  selectedTerritory?: SelectedTerritory | null;
  onTerritoryClick?: (territory: SelectedTerritory) => void;
  colorMode?: ColorMode;
  ageFilter?: AgeFilter;
  statusFilter?: StatusFilter;
  hideBoundary?: boolean;
}

export default function TerritoryLayer({
  map,
  territories,
  selectedTerritory,
  onTerritoryClick,
  colorMode = 'gradient',
  ageFilter = 'all',
  statusFilter = 'all',
  hideBoundary = true,
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

    // Appliquer les filtres
    const filteredFeatures = territories.features.filter((feature) => {
      const props = feature.properties as EnrichedTerritoryProperties;
      return applyFilters(props, statusFilter, ageFilter, hideBoundary);
    });

    console.log('🔍 Filtres appliqués:', {
      total: territories.features.length,
      filtered: filteredFeatures.length,
      colorMode,
      statusFilter,
      ageFilter,
      hideBoundary
    });

    // Calculer min/max days depuis le retour pour le gradient continu
    // Filtrer les dates aberrantes (négatives ou > 10 ans)
    const MAX_DAYS_THRESHOLD = 3650; // 10 ans
    const availableWithDays = territories.features
      .map(f => (f.properties as EnrichedTerritoryProperties))
      .filter(p =>
        p.status === 'available' &&
        p.daysSinceLastReturn !== undefined &&
        p.daysSinceLastReturn >= 0 &&
        p.daysSinceLastReturn <= MAX_DAYS_THRESHOLD
      )
      .map(p => p.daysSinceLastReturn!);

    const minDays = availableWithDays.length > 0 ? Math.min(...availableWithDays) : 0;
    const maxDays = availableWithDays.length > 0 ? Math.max(...availableWithDays) : 0;

    // Compter les dates aberrantes pour diagnostic
    const aberrantDates = territories.features
      .map(f => (f.properties as EnrichedTerritoryProperties))
      .filter(p =>
        p.status === 'available' &&
        p.daysSinceLastReturn !== undefined &&
        (p.daysSinceLastReturn < 0 || p.daysSinceLastReturn > MAX_DAYS_THRESHOLD)
      );

    console.log('🎨 Gradient range:', {
      minDays,
      maxDays,
      count: availableWithDays.length,
      aberrantCount: aberrantDates.length
    });

    if (aberrantDates.length > 0) {
      console.warn('⚠️ Dates aberrantes détectées (ignorées pour le gradient):',
        aberrantDates.slice(0, 5).map(p => ({
          code: p.code,
          daysSince: p.daysSinceLastReturn,
          returnedAt: p.returnedAt
        }))
      );
    }

    // Exemples de gradient (premiers et derniers) - uniquement dates valides
    const validAvailable = territories.features
      .map(f => (f.properties as EnrichedTerritoryProperties))
      .filter(p =>
        p.status === 'available' &&
        p.daysSinceLastReturn !== undefined &&
        p.daysSinceLastReturn >= 0 &&
        p.daysSinceLastReturn <= MAX_DAYS_THRESHOLD
      )
      .sort((a, b) => (a.daysSinceLastReturn || 0) - (b.daysSinceLastReturn || 0));

    const gradientExamples = validAvailable
      .slice(0, 3)
      .concat(validAvailable.slice(-3))
      .map(p => {
        const style = getStyleByStatus(p.status, p.daysSinceLastReturn, minDays, maxDays, colorMode);
        return {
          code: p.code,
          daysSince: p.daysSinceLastReturn,
          ratio: maxDays > minDays ? ((p.daysSinceLastReturn || 0) - minDays) / (maxDays - minDays) : 1,
          fillColor: style.fillColor,
        };
      });

    console.log(`🌈 Exemples ${colorMode === 'thresholds' ? 'seuils' : 'gradient'} (3 plus récents + 3 plus anciens, dates valides):`);
    console.table(gradientExamples);

    // Créer un groupe de couches (featureGroup permet getBounds)
    const layerGroup = L.featureGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    // Compteur pour logger quelques territoires disponibles
    let availableLoggedCount = 0;

    // Ajouter chaque territoire FILTRÉ
    filteredFeatures.forEach((feature: TerritoryFeature, index) => {
      const geoJsonLayer = L.geoJSON(feature, {
        style: (feature) => {
          // Style sélectionné si c'est le territoire actuel
          if (selectedTerritory && feature?.properties?.name === selectedTerritory.name) {
            return SELECTED_TERRITORY_STYLE;
          }

          // Style selon le statut et le mode couleur (Sprint 2 - Google Sheets)
          const props = feature?.properties as Partial<EnrichedTerritoryProperties>;
          if (props?.status) {
            const computedStyle = getStyleByStatus(props.status, props.daysSinceLastReturn, minDays, maxDays, colorMode);

            // Log des 2 premiers territoires disponibles pour debug
            if (props.status === 'available' && availableLoggedCount < 2) {
              console.log(`🎨 Style territoire disponible #${availableLoggedCount + 1} (${colorMode}):`, {
                code: props.code,
                daysSince: props.daysSinceLastReturn,
                fillColor: computedStyle.fillColor,
                fullStyle: computedStyle
              });
              availableLoggedCount++;
            }

            return computedStyle;
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
                  const baseStyle = getStyleByStatus(props.status, props.daysSinceLastReturn, minDays, maxDays, colorMode);
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
                // Restaurer le style basé sur le statut et le mode couleur
                const props = feature.properties as Partial<EnrichedTerritoryProperties>;
                if (props?.status) {
                  layer.setStyle(getStyleByStatus(props.status, props.daysSinceLastReturn, minDays, maxDays, colorMode));
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
  }, [map, territories, selectedTerritory, onTerritoryClick, colorMode, ageFilter, statusFilter, hideBoundary]);

  // Re-styler les couches quand le territoire sélectionné ou le mode couleur change
  useEffect(() => {
    if (!layerGroupRef.current || !territories) return;

    // Recalculer min/max days pour le gradient (filtrer dates aberrantes)
    const MAX_DAYS_THRESHOLD = 3650; // 10 ans
    const availableWithDays = territories.features
      .map(f => (f.properties as EnrichedTerritoryProperties))
      .filter(p =>
        p.status === 'available' &&
        p.daysSinceLastReturn !== undefined &&
        p.daysSinceLastReturn >= 0 &&
        p.daysSinceLastReturn <= MAX_DAYS_THRESHOLD
      )
      .map(p => p.daysSinceLastReturn!);

    const minDays = availableWithDays.length > 0 ? Math.min(...availableWithDays) : 0;
    const maxDays = availableWithDays.length > 0 ? Math.max(...availableWithDays) : 0;

    layerGroupRef.current.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) {
        layer.eachLayer((subLayer) => {
          if (subLayer instanceof L.Path) {
            const feature = (subLayer as L.Path & { feature?: TerritoryFeature }).feature;
            if (feature?.properties) {
              if (selectedTerritory && feature.properties.name === selectedTerritory.name) {
                subLayer.setStyle(SELECTED_TERRITORY_STYLE);
              } else {
                // Utiliser le style basé sur le statut et le mode couleur (Sprint 2)
                const props = feature.properties as Partial<EnrichedTerritoryProperties>;
                if (props?.status) {
                  subLayer.setStyle(getStyleByStatus(props.status, props.daysSinceLastReturn, minDays, maxDays, colorMode));
                } else {
                  subLayer.setStyle(DEFAULT_TERRITORY_STYLE);
                }
              }
            }
          }
        });
      }
    });
  }, [selectedTerritory, territories, colorMode]);

  return null; // Ce composant ne rend rien visuellement
}
