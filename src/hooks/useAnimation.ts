import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimationState, AnimationControls, Keyframe } from '../types/animations';
import { getSettingsAtTime } from '../utils/animation';

/**
 * Custom hook for animation playback
 */
export const useAnimation = (
  duration: number = 5, 
  onFrame?: (time: number, settings: any) => void,
  keyframes: Keyframe[] = []
): [AnimationState, AnimationControls] => {
  const [state, setState] = useState<AnimationState>({
    isPlaying: false,
    currentTime: 0,
    duration,
    speed: 1,
    loop: false
  });
  
  const lastFrameTimeRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const keyframesRef = useRef<Keyframe[]>(keyframes);
  
  // Update keyframes ref when keyframes prop changes
  useEffect(() => {
    keyframesRef.current = keyframes;
  }, [keyframes]);
  
  // Update duration in state when the duration prop changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      duration
    }));
  }, [duration]);
  
  // Animation frame callback
  const animationFrame = useCallback((timestamp: number) => {
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
      animationFrameIdRef.current = requestAnimationFrame(animationFrame);
      return;
    }
    
    const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000; // in seconds
    lastFrameTimeRef.current = timestamp;
    
    // Calculate new time with speed
    let newTime = state.currentTime + (deltaTime * state.speed);
    
    // Loop animation if reached end and loop is enabled
    if (newTime >= state.duration) {
      if (state.loop) {
        newTime = 0;
        // Force a reset of the last timestamp to avoid a time jump
        lastFrameTimeRef.current = timestamp;
      } else {
        newTime = state.duration;
      }
    }
    
    // Update state
    setState(prev => ({
      ...prev,
      currentTime: newTime
    }));
    
    // Get interpolated settings at the current time
    if (onFrame && keyframesRef.current.length > 0) {
      const settings = getSettingsAtTime(keyframesRef.current, newTime);
      if (settings) {
        onFrame(newTime, settings);
      }
    }
    
    // Continue animation loop only if still playing
    if (state.isPlaying) {
      animationFrameIdRef.current = requestAnimationFrame(animationFrame);
    }
  }, [state.currentTime, state.speed, state.duration, state.isPlaying, state.loop, onFrame]);
  
  // Play function
  const play = useCallback(() => {
    if (state.isPlaying) return;
    
    setState(prev => ({ ...prev, isPlaying: true }));
    lastFrameTimeRef.current = null;
    animationFrameIdRef.current = requestAnimationFrame(animationFrame);
  }, [state.isPlaying, animationFrame]);
  
  // Pause function
  const pause = useCallback(() => {
    if (!state.isPlaying) return;
    
    setState(prev => ({ ...prev, isPlaying: false }));
    
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, [state.isPlaying]);
  
  // Stop function
  const stop = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    // Call onFrame with time 0 to update UI
    if (onFrame && keyframesRef.current.length > 0) {
      const settings = getSettingsAtTime(keyframesRef.current, 0);
      if (settings) {
        onFrame(0, settings);
      }
    }
  }, [onFrame]);
  
  // Set speed function
  const setSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, speed }));
  }, []);
  
  // Set time function
  const setTime = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, state.duration));
    
    setState(prev => ({ ...prev, currentTime: clampedTime }));
    
    // Call onFrame to update UI immediately when time changes
    if (onFrame && keyframesRef.current.length > 0) {
      const settings = getSettingsAtTime(keyframesRef.current, clampedTime);
      if (settings) {
        onFrame(clampedTime, settings);
      }
    }
  }, [state.duration, onFrame]);
  
  // Set loop function
  const setLoop = useCallback((loop: boolean) => {
    setState(prev => ({ ...prev, loop }));
  }, []);
  
  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);
  
  // Create controls object
  const controls: AnimationControls = {
    play,
    pause,
    stop,
    setSpeed,
    setTime,
    setLoop
  };
  
  return [state, controls];
}; 