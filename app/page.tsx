'use client';

import dynamic from 'next/dynamic';

const MapLibreMap = dynamic(() => import('@/components/MapLibreMap'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
});

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">PRISM Temperature Data - MapLibre GL JS</h1>
      <MapLibreMap />
    </div>
  );
}