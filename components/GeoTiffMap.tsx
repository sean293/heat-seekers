'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import parseGeoraster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';

export default function GeoTiffMap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current || mapRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      const map = L.map(containerRef.current).setView([39.8283, -98.5795], 4);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      fetch('/prism_tdmean_us_25m_20250308.tif')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => parseGeoraster(arrayBuffer))
        .then(georaster => {
          if (!mapRef.current) return;
          
          const layer = new GeoRasterLayer({
            georaster: georaster,
            opacity: 0.7,
            pixelValuesToColorFn: (values: number[]) => {
              const value = values[0];
              if (value === null) return null;
              const normalized = (value + 20) / 60;
              return `hsl(${240 - normalized * 240}, 100%, 50%)`;
            },
            resolution: 256
          });
          layer.addTo(mapRef.current);
          mapRef.current.fitBounds(layer.getBounds());
        })
        .catch(err => console.error('Error loading GeoTIFF:', err));
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient]);

  if (!isClient) {
    return <p>Loading map...</p>;
  }

  return <div ref={containerRef} style={{ height: '600px', width: '100%' }} />;
}