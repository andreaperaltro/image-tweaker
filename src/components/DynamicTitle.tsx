'use client';

import { useEffect } from 'react';

interface DynamicTitleProps {
  baseTitle?: string;
}

const DynamicTitle: React.FC<DynamicTitleProps> = ({ 
  baseTitle = 'ImageTweaker'
}) => {
  useEffect(() => {
    // Store the original title
    const originalTitle = document.title;
    
    // Character replacement map (leet speak style)
    const replacementMap: Record<string, string> = {
      'a': '4',
      'A': '4',
      'e': '3',
      'E': '3',
      'i': '1',
      'I': '1',
      'o': '0',
      'O': '0',
      's': '5',
      'S': '5',
      't': '7',
      'T': '7',
      'b': '8',
      'B': '8',
      'g': '9',
      'G': '9',
      'z': '2',
      'Z': '2'
    };
    
    // Function to randomly replace 1-2 characters in the title
    const glitchTitle = (title: string): string => {
      // Convert title to an array of characters
      const chars = title.split('');
      
      // Determine how many characters to replace (1 or 2)
      const numReplacements = Math.floor(Math.random() * 2) + 1;
      
      // Track which positions we've already replaced
      const replacedPositions: number[] = [];
      
      for (let i = 0; i < numReplacements; i++) {
        // Find a character that has a replacement and hasn't been replaced yet
        let attempts = 0;
        let position;
        
        // Try to find a suitable position (max 10 attempts to prevent infinite loop)
        while (attempts < 10) {
          position = Math.floor(Math.random() * chars.length);
          
          // If we haven't replaced this position yet and it has a replacement
          if (!replacedPositions.includes(position) && replacementMap[chars[position]]) {
            replacedPositions.push(position);
            chars[position] = replacementMap[chars[position]];
            break;
          }
          
          attempts++;
        }
      }
      
      return chars.join('');
    };
    
    // Change the title periodically
    const interval = setInterval(() => {
      document.title = glitchTitle(baseTitle);
    }, 800); // Change every 800ms (slightly slower for better readability)
    
    // Restore original title when component unmounts
    return () => {
      clearInterval(interval);
      document.title = originalTitle;
    };
  }, [baseTitle]);
  
  // This component doesn't render anything visible
  return null;
};

export default DynamicTitle; 