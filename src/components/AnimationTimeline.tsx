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
  const [openPanelId, setOpenPanelId] = useState<string | null>(null);

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
    
    // Always set the current time on click
    controls.setTime(clickTime);
    
    // If Control/Command key is pressed, add a keyframe at current time
    if (e.ctrlKey || e.metaKey) {
      const currentSettings: EffectSettings = {} as EffectSettings;
      
      // Only capture current state if we have a selected keyframe to base it off
      if (selectedKeyframeId) {
        const selectedKeyframe = keyframes.find(k => k.id === selectedKeyframeId);
        if (selectedKeyframe) {
          onAddKeyframe(selectedKeyframe.settings);
          return;
        }
      }
      
      onAddKeyframe(currentSettings);
    }
  };

  // Handle keyframe drag start
  const handleKeyframeDragStart = (e: React.MouseEvent<HTMLElement>, id: string) => {
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

  // Handle keyframe click
  const handleKeyframeClick = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.stopPropagation();
    onSelectKeyframe(id);
    setOpenPanelId(id);
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
      {/* Top controls */}
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
      
      {/* Timeline container */}
      <div className="relative">
        {/* Base timeline with time markers */}
        <div 
          className="h-24 bg-[var(--header-bg)] rounded mt-2 cursor-pointer relative" 
          ref={timelineRef}
          onClick={handleTimelineClick}
        >
          {/* Time markers container with padding */}
          <div className="absolute inset-x-4 inset-y-0">
            {/* Time markers */}
            <div className="relative h-full">
              {/* Start marker */}
              <div className="absolute left-0 h-full">
                <div className="absolute top-2 text-xs font-mono text-gray-400">
                  {formatTime(0)}
                </div>
                <div className="absolute h-full w-px bg-gray-600" />
              </div>

              {/* Middle markers */}
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className="absolute h-full"
                  style={{ left: `${(i * 20)}%` }}
                >
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-mono text-gray-400 whitespace-nowrap">
                    {formatTime((i / 5) * state.duration)}
                  </div>
                  <div className="absolute h-full w-px bg-gray-600" />
                </div>
              ))}

              {/* End marker */}
              <div className="absolute right-0 h-full">
                <div className="absolute top-2 right-0 text-xs font-mono text-gray-400">
                  {formatTime(state.duration)}
                </div>
                <div className="absolute h-full w-px bg-gray-600" />
              </div>

              {/* Current time indicator */}
              <div 
                className="absolute top-0 h-full w-0.5 bg-[#10b981] pointer-events-none"
                style={{ 
                  left: `clamp(0%, ${(state.currentTime / state.duration) * 100}%, 100%)`
                }}
              />

              {/* Keyframes */}
              {keyframes.map((keyframe) => (
                <div 
                  key={keyframe.id}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ 
                    left: `clamp(0%, ${(keyframe.time / state.duration) * 100}%, 100%)`
                  }}
                >
                  <button
                    className={`w-8 h-8 rounded-full cursor-pointer transform -translate-x-1/2 border-2 flex items-center justify-center ${
                      keyframe.id === selectedKeyframeId
                        ? 'bg-[#10b981] border-[#059669]'
                        : 'bg-[var(--header-bg)] border-gray-600'
                    } hover:scale-110 transition-transform`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectKeyframe(keyframe.id);
                    }}
                    title={`Keyframe at ${formatTime(keyframe.time)}`}
                  >
                    <div className="w-3 h-3 rounded-full bg-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls below timeline */}
        <div className="flex items-start mt-2 gap-3">
          {/* Add keyframe button */}
          <button
            className="bg-[var(--header-bg)] text-white p-2.5 rounded-full hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center group"
            onClick={(e) => {
              e.stopPropagation();
              onAddKeyframe({} as EffectSettings);
            }}
            title="Add keyframe at current time"
          >
            <FiPlus size={24} className="group-hover:rotate-90 transition-transform" />
          </button>

          {/* Keyframe controls - always visible */}
          <div className="flex-1 bg-[var(--header-bg)] p-3 rounded text-sm text-[var(--text-color)]">
            {selectedKeyframeId ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Time input */}
                  <div className="flex items-center gap-2">
                    <span>Time:</span>
                    <input
                      type="number"
                      min={0}
                      max={state.duration}
                      step={0.01}
                      value={keyframes.find(k => k.id === selectedKeyframeId)?.time || 0}
                      onChange={(e) => {
                        const newTime = Math.min(Math.max(0, parseFloat(e.target.value)), state.duration);
                        onUpdateKeyframe(selectedKeyframeId, newTime);
                      }}
                      className="w-20 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded py-1 px-2 text-sm"
                    />
                    <span className="text-[var(--text-secondary)]">/ {state.duration}s</span>
                  </div>

                  {/* Easing selector */}
                  <div className="flex items-center gap-2">
                    <span>Easing:</span>
                    <select
                      className="bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded py-1 px-2 text-sm"
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

                {/* Delete button */}
                <button
                  onClick={() => {
                    onDeleteKeyframe(selectedKeyframeId);
                    onSelectKeyframe(''); // Clear selection after delete
                  }}
                  className="flex items-center gap-1 text-red-500 hover:text-red-400 transition-colors"
                  title="Delete keyframe"
                >
                  <FiTrash size={16} />
                  <span>Delete</span>
                </button>
              </div>
            ) : (
              <div className="text-[var(--text-secondary)]">
                Click timeline to navigate • Ctrl+Click to add keyframe • Click keyframe to edit
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimationTimeline;