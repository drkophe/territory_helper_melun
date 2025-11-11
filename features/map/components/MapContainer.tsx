'use client';

/**
 * Composant conteneur de la carte Leaflet
 * Client component car Leaflet nécessite le DOM
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG, TILE_LAYER_CONFIG } from '../config';

interface MapContainerProps {
  children?: (map: L.Map) => React.ReactNode;
  onMapReady?: (map: L.Map) => void;
}

export default function MapContainer({ onMapReady }: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Créer la carte
    const map = L.map(containerRef.current, {
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    });

    // Ajouter la couche de tuiles
    L.tileLayer(TILE_LAYER_CONFIG.url, {
      attribution: TILE_LAYER_CONFIG.attribution,
      maxZoom: TILE_LAYER_CONFIG.maxZoom,
    }).addTo(map);

    mapRef.current = map;

    // Notifier que la carte est prête
    if (onMapReady) {
      onMapReady(map);
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onMapReady]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '500px' }}
    />
  );
}
