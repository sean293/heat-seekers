'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { fromArrayBuffer } from 'geotiff';

export default function MapLibreMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('1. Component mounted');
    
    if (!mapContainer.current) {
      console.log('2. Container ref not ready');
      return;
    }
    
    if (map.current) {
      console.log('2. Map already initialized');
      return;
    }

    console.log('3. Initializing map...');

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm'
            }
          ]
        },
        center: [-98.5795, 39.8283],
        zoom: 4
      });
      
      console.log('4. Map instance created');

      map.current.on('load', async () => {
        console.log('5. Map loaded event fired');
        
        try {
          console.log('6. Fetching GeoTIFF...');
          const response = await fetch('/prism_tdmean_us_25m_20250308.tif');
          console.log('7. Response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          console.log('8. ArrayBuffer size:', arrayBuffer.byteLength);
          
          const tiff = await fromArrayBuffer(arrayBuffer);
          console.log('9. GeoTIFF parsed successfully');
          
          const image = await tiff.getImage();
          console.log('10. Got image from GeoTIFF');
          
          const data = await image.readRasters();
          console.log('11. Read raster data');
          
          const bbox = image.getBoundingBox();
          console.log('12. Bounding box:', bbox);
          
          // Get dimensions
          const width = image.getWidth();
          const height = image.getHeight();
          console.log('13. Image dimensions:', width, 'x', height);
          
          // Create canvas to render the data
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            console.log('14. Canvas context created');
            const imageData = ctx.createImageData(width, height);
            const values = data[0]; // First band
            
            // Color scale for temperature
            for (let i = 0; i < values.length; i++) {
              const value = values[i];
              const normalized = (value + 20) / 60; // Adjust based on your data range
              const hue = 240 - normalized * 240;
              
              // Convert HSL to RGB
              const c = 1; // saturation
              const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
              let r = 0, g = 0, b = 0;
              
              if (hue >= 0 && hue < 60) { r = c; g = x; }
              else if (hue >= 60 && hue < 120) { r = x; g = c; }
              else if (hue >= 120 && hue < 180) { g = c; b = x; }
              else if (hue >= 180 && hue < 240) { g = x; b = c; }
              else if (hue >= 240 && hue < 300) { r = x; b = c; }
              else { r = c; b = x; }
              
              imageData.data[i * 4] = r * 255;
              imageData.data[i * 4 + 1] = g * 255;
              imageData.data[i * 4 + 2] = b * 255;
              imageData.data[i * 4 + 3] = 180; // opacity
            }
            
            console.log('15. Applied color scale to pixels');
            ctx.putImageData(imageData, 0, 0);
            console.log('16. Put image data on canvas');
            
            // Add as image source
            if (map.current) {
              map.current.addSource('geotiff', {
                type: 'image',
                url: canvas.toDataURL(),
                coordinates: [
                  [bbox[0], bbox[3]], // top-left
                  [bbox[2], bbox[3]], // top-right
                  [bbox[2], bbox[1]], // bottom-right
                  [bbox[0], bbox[1]]  // bottom-left
                ]
              });
              
              console.log('17. Added image source to map');
              
              map.current.addLayer({
                id: 'geotiff-layer',
                type: 'raster',
                source: 'geotiff',
                paint: {
                  'raster-opacity': 0.7
                }
              });
              
              console.log('18. Added raster layer to map');
              
              // Fit bounds
              map.current.fitBounds([
                [bbox[0], bbox[1]],
                [bbox[2], bbox[3]]
              ]);
              
              console.log('19. Fitted map to bounds');
            }
          }
          
          setIsLoading(false);
          console.log('20. Loading complete!');
        } catch (error) {
          console.error('Error loading GeoTIFF:', error);
          setIsLoading(false);
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

    } catch (error) {
      console.error('Error creating map:', error);
      setIsLoading(false);
    }

    return () => {
      console.log('Cleanup - removing map');
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded shadow z-10">
          Loading GeoTIFF...
        </div>
      )}
      <div ref={mapContainer} style={{ height: '600px', width: '100%' }} />
    </div>
  );
}