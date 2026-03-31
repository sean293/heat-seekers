'use client';

import { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoTIFF from 'ol/source/GeoTIFF';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import { fromLonLat } from 'ol/proj';

export default function OpenLayersMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create base layer
    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    // Create GeoTIFF layer with configuration to handle deferred fields
    const geotiffSource = new GeoTIFF({
      sources: [
        {
          url: '/prism_tdmean_us_25m_20250308.tif',
          nodata: NaN, // Explicitly set nodata value to avoid deferred field error
        },
      ],
      convertToRGB: false,
      normalize: false,
      interpolate: false,
    });

    const geotiffLayer = new WebGLTileLayer({
      source: geotiffSource,
      style: {
        color: [
          'interpolate',
          ['linear'],
          ['band', 1],
          -20, [0, 0, 255, 1],      // Blue for cold
          0, [0, 255, 255, 1],      // Cyan
          20, [0, 255, 0, 1],       // Green
          40, [255, 255, 0, 1],     // Yellow
          60, [255, 0, 0, 1],       // Red for hot
        ],
      },
      opacity: 0.7,
    });

    // Initialize map
    const map = new Map({
      target: mapRef.current,
      layers: [osmLayer, geotiffLayer],
      view: new View({
        center: fromLonLat([-98.5795, 39.8283]),
        zoom: 4,
      }),
    });

    mapInstanceRef.current = map;

    // Fit to GeoTIFF extent once loaded
    geotiffSource.on('change', async () => {
      if (geotiffSource.getState() === 'ready') {
        try {
          const view = await geotiffSource.getView();
          const extent = view?.extent;
          if (extent) {
            map.getView().fit(extent, { padding: [50, 50, 50, 50] });
          }
        } catch (error) {
          console.error('Error fitting to extent:', error);
        }
      }
    });

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '600px' }} />;
}