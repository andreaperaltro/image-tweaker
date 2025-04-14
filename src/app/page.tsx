'use client';

import dynamic from 'next/dynamic';

// Import the AdvancedEditor component with dynamic import to avoid SSR issues
const AdvancedEditor = dynamic(() => import('@/components/AdvancedEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="w-12 h-12 mb-2 border-2 border-black"></div>
      <div className="h-4 w-32 bg-black"></div>
      <div className="mt-2 h-3 w-48 bg-gray-700"></div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <header className="bg-black text-white p-3 border-b-2 border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto">
          <h1 className="text-xl md:text-2xl pp-mondwest-font uppercase">ImageTweaker</h1>
          <p className="text-xs pp-mondwest-font">Image manipulation studio</p>
        </div>
      </header>

      <div className="container mx-auto py-4 md:py-6 px-2 md:px-3">
        <div className="border-2 border-black p-2 md:p-3">
          <AdvancedEditor />
        </div>
      </div>

      <footer className="bg-black text-white p-3 mt-4 md:mt-8 border-t-2 border-gray-700">
        <div className="container mx-auto text-center">
          <p className="text-xs pp-mondwest-font uppercase">ImageTweaker | Image manipulation app</p>
          <p className="text-xs text-gray-400 pp-mondwest-font">
            All processing happens on your device
          </p>
          <p className="text-xs text-gray-400 pp-mondwest-font mt-2">
            Created by <a href="https://andreaperato.com" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Andrea Perato</a> with AI assistance
          </p>
        </div>
      </footer>
    </main>
  );
} 