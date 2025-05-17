'use client'

import React, { useState, useRef } from 'react';
import { AnimationTimelineProps, EasingType } from '../types/animations';
import { FiPlay, FiPause, FiSquare, FiTrash, FiPlus } from 'react-icons/fi';
import { EffectSettings } from '../utils/EffectSettingsUtils';

const AnimationTimeline: React.FC<AnimationTimelineProps> = ({
  keyframes,
  state,
  controls,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
  onSelectKeyframe,
  selectedKeyframeId,
  onDurationChange
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragKeyframeId, setDragKeyframeId] = useState<string | null>(null);

  // Format time as MM:SS.ms
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Handle timeline click to add keyframe
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || isDragging) return;
    
    // Get click position relative to timeline
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    
    // Calculate time from position
    const clickTime = (offsetX / width) * state.duration;
    
    // Set the current time (navigation)
    controls.setTime(clickTime);
    
    // If Control key is pressed, also add a keyframe
    if (e.ctrlKey || e.metaKey) {
      // Create snapshot of current settings
      const currentSettings: EffectSettings = {} as EffectSettings;
      
      // Only capture current state if we have a selected keyframe to base it off
      if (selectedKeyframeId) {
        const selectedKeyframe = keyframes.find(k => k.id === selectedKeyframeId);
        if (selectedKeyframe) {
          // Use settings from selected keyframe as base
          onAddKeyframe(selectedKeyframe.settings);
          return;
        }
      }
      
      // If no selected keyframe, add new keyframe with current state
      onAddKeyframe(currentSettings);
    }
  };

  // Handle keyframe drag start
  const handleKeyframeDragStart = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragKeyframeId(id);
    onSelectKeyframe(id);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current) return;
      
      // Get mouse position relative to timeline
      const rect = timelineRef.current.getBoundingClientRect();
      const offsetX = moveEvent.clientX - rect.left;
      const width = rect.width;
      
      // Calculate new time, clamped to timeline
      const newTime = Math.max(0, Math.min((offsetX / width) * state.duration, state.duration));
      
      // Update keyframe time
      onUpdateKeyframe(id, newTime);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragKeyframeId(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle keyframe delete
  const handleKeyframeDelete = (e: React.MouseEvent<SVGElement>, id: string) => {
    e.stopPropagation();
    onDeleteKeyframe(id);
    if (selectedKeyframeId === id) {
      // Clear selection if deleted keyframe was selected
      onSelectKeyframe('');
    }
  };

  // Handle easing change
  const handleEasingChange = (id: string, easing: EasingType) => {
    const keyframe = keyframes.find(k => k.id === id);
    if (keyframe) {
      onUpdateKeyframe(id, keyframe.time, easing);
    }
  };

  return (
    <div className="bg-[var(--accent-bg)] p-4 rounded-lg border border-[var(--border-color)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex space-x-3 items-center">
          {/* Play/Pause button */}
          <button 
            onClick={state.isPlaying ? controls.pause : controls.play}
            className="flex items-center justify-center w-8 h-8 bg-[var(--header-bg)] text-white rounded hover:bg-gray-800 transition-colors"
          >
            {state.isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
          </button>
          
          {/* Stop button */}
          <button 
            onClick={controls.stop}
            className="flex items-center justify-center w-8 h-8 bg-[var(--header-bg)] text-white rounded hover:bg-gray-800 transition-colors"
          >
            <FiSquare size={20} />
          </button>
          
          {/* Time display */}
          <div className="font-mono text-[var(--text-color)]">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </div>
        </div>
        
        {/* Fixed duration display - replacing dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-[var(--text-color)]">Duration:</span>
          <select
            className="bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded py-1 px-2 text-xs text-[var(--text-color)]"
            value={state.duration}
            onChange={e => onDurationChange && onDurationChange(Number(e.target.value))}
          >
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
          </select>
          <label className="mobile-effect-toggle">
            <input 
              type="checkbox" 
              checked={state.loop}
              onChange={() => controls.setLoop(!state.loop)}
            />
            <span className="mobile-effect-toggle-slider"></span>
          </label>
          <span className="ms-3 text-sm font-medium text-[var(--text-primary)]">Loop</span>
        </div>
      </div>
      
      {/* Timeline */}
      <div 
        className="relative h-24 bg-[var(--header-bg)] rounded mt-2 overflow-hidden" 
        ref={timelineRef} 
        onClick={handleTimelineClick}
      >
        {/* Time markers */}
        <div className="absolute top-0 left-0 w-full h-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute top-0 h-full w-px bg-gray-600"
              style={{ left: `${(i / 5) * 100}%` }}
            >
              <div className="absolute top-0 transform -translate-x-1/2 text-xs font-mono text-gray-400">
                {formatTime((i / 5) * state.duration)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Current time indicator */}
        <div 
          className="absolute top-0 h-full w-0.5 bg-[#10b981] z-10"
          style={{ left: `${(state.currentTime / state.duration) * 100}%` }}
        ></div>
        
        {/* Keyframes */}
        {keyframes.map((keyframe) => (
          <div
            key={keyframe.id}
            className={`absolute w-4 h-4 rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 border-2 ${
              keyframe.id === selectedKeyframeId
                ? 'bg-[#10b981] border-[#059669]'
                : 'bg-[var(--header-bg)] border-gray-600'
            } hover:scale-110 transition-transform`}
            style={{
              left: `${(keyframe.time / state.duration) * 100}%`,
              top: '50%',
            }}
            onMouseDown={(e) => handleKeyframeDragStart(e, keyframe.id)}
            title={`Keyframe at ${formatTime(keyframe.time)}`}
          >
            {/* Delete button */}
            <FiTrash
              size={12}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-red-500 hover:text-red-400 cursor-pointer"
              onClick={(e) => handleKeyframeDelete(e, keyframe.id)}
            />
          </div>
        ))}
        
        {/* Add keyframe button */}
        <button
          className="absolute right-2 bottom-2 bg-[var(--header-bg)] text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onAddKeyframe({} as EffectSettings); // Add keyframe at current time
          }}
        >
          <FiPlus size={16} />
        </button>
      </div>
      
      {/* Selected keyframe details */}
      {selectedKeyframeId && (
        <div className="mt-2 bg-[var(--header-bg)] p-2 rounded text-sm text-[var(--text-color)]">
          <div className="flex justify-between items-center">
            <div>Selected: {formatTime(keyframes.find(k => k.id === selectedKeyframeId)?.time || 0)}</div>
            <div className="flex items-center space-x-2">
              <span>Easing:</span>
              <select
                className="bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded py-1 px-2 text-xs text-[var(--text-color)]"
                value={keyframes.find(k => k.id === selectedKeyframeId)?.easing || 'linear'}
                onChange={(e) => handleEasingChange(selectedKeyframeId, e.target.value as EasingType)}
              >
                <option value="linear">Linear</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In Out</option>
                <option value="cubic-bezier">Cubic Bezier</option>
              </select>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            Click timeline to navigate • Ctrl+Click to add keyframe
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimationTimeline; 