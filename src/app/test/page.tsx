'use client';

import { useEffect, useRef } from 'react';

export default function TestPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Add Tweakpane script to the page
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
    script.type = 'module';
    script.onload = initTweakpane;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  function initTweakpane() {
    if (!containerRef.current) return;
    
    // Access Tweakpane from the global scope
    const Tweakpane = (window as any).Tweakpane;
    if (!Tweakpane) {
      console.error('Tweakpane not loaded');
      return;
    }
    
    try {
      const params = {
        number: 50,
        boolean: true,
        string: 'hello',
        color: '#ff0000'
      };
      
      const pane = new Tweakpane.Pane({
        container: containerRef.current,
        title: 'Simple Test'
      });
      
      // Add controls
      pane.addBinding(params, 'number', { min: 0, max: 100 });
      pane.addBinding(params, 'boolean');
      pane.addBinding(params, 'string');
      pane.addBinding(params, 'color');
      
      // Add a button
      pane.addButton({ title: 'Click Me' }).on('click', () => {
        console.log('Button clicked');
      });
      
      console.log('Tweakpane initialized successfully');
    } catch (error) {
      console.error('Error initializing Tweakpane:', error);
    }
  }
  
  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Tweakpane Simple Test</h1>
      <p className="mb-4">Testing Tweakpane with direct script loading</p>
      
      <div className="flex gap-4">
        <div className="bg-white p-4 rounded shadow-md w-2/3">
          <h2 className="text-xl font-semibold mb-2">Canvas Area</h2>
          <div className="bg-gray-200 h-80 rounded"></div>
        </div>
        
        <div ref={containerRef} className="w-1/3"></div>
      </div>
    </div>
  );
} 