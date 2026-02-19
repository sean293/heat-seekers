'use client';

import dynamic from 'next/dynamic';

const GeoTiffMap = dynamic(() => import('@/components/GeoTiffMap'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
});

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">PRISM Temperature Data</h1>
      <GeoTiffMap />
    </div>
  );
}
