import Head from 'next/head';
import dynamic from 'next/dynamic';

// Get map component with dynamic import
const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

export default function Home() {
  return (
    <main className='h-screen w-screen'>
      <MapComponent />
    </main>
  );
}
