'use client';

import dynamic from 'next/dynamic';

// Import the AdvancedEditor component with dynamic import to avoid SSR issues
const AdvancedEditor = dynamic(() => import('@/components/AdvancedEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-96 animate-pulse">
      <div className="w-24 h-24 mb-4 rounded-full bg-blue-200"></div>
      <div className="h-6 w-48 bg-blue-200 rounded"></div>
      <div className="mt-3 h-4 w-64 bg-gray-200 rounded"></div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">ImageTweaker Advanced</h1>
          <p className="text-sm opacity-80">Your powerful image manipulation studio</p>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-xl p-4 md:p-8">
          <AdvancedEditor />
        </div>
      </div>

      <footer className="bg-gray-800 text-white p-4 mt-12">
        <div className="container mx-auto text-center text-sm">
          <p className="mb-2">ImageTweaker Advanced | Progressive Web App for image manipulation</p>
          <p className="text-xs text-gray-400">
            Edit your images with advanced controls for canvas size, aspect ratio, and more. Your images never leave your device.
          </p>
        </div>
      </footer>
    </main>
  );
} 