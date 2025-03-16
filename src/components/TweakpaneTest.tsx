'use client';

import { useEffect, useRef } from 'react';
import { Pane } from 'tweakpane';
import type { ButtonApi, FolderApi, InputBindingApi } from '@tweakpane/core';

export default function TweakpaneTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<Pane | null>(null);

  useEffect(() => {
    // Clean up any existing pane
    if (paneRef.current) {
      paneRef.current.dispose();
      paneRef.current = null;
    }

    if (containerRef.current && !paneRef.current) {
      console.log('Initializing test Tweakpane...');
      
      try {
        // Create simple parameters
        const params = {
          testNumber: 50,
          testBool: true,
          testString: 'Hello Tweakpane',
          testColor: '#ff0000'
        };
        
        // Create Tweakpane instance
        const pane = new Pane({
          container: containerRef.current,
          title: 'Tweakpane Test'
        });
        
        // Add some simple controls
        pane.addBinding(params, 'testNumber', {
          min: 0,
          max: 100,
          step: 1,
        }).on('change', (ev) => {
          console.log('Number changed:', ev.value);
        });
        
        pane.addBinding(params, 'testBool').on('change', (ev) => {
          console.log('Boolean changed:', ev.value);
        });
        
        pane.addBinding(params, 'testString').on('change', (ev) => {
          console.log('String changed:', ev.value);
        });
        
        pane.addButton({ title: 'Click Me' }).on('click', () => {
          console.log('Button clicked');
        });
        
        console.log('Test pane created successfully');
        paneRef.current = pane;
      } catch (error) {
        console.error('Error creating test pane:', error);
      }
    }
    
    return () => {
      if (paneRef.current) {
        paneRef.current.dispose();
        paneRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Tweakpane Test Component</h1>
      <p className="mb-4">This is a simple test of Tweakpane functionality.</p>
      
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