import { EffectSettings } from "../utils/EffectSettingsUtils";

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';

export interface Keyframe {
  id: string;
  time: number;
  settings: EffectSettings;
  easing: EasingType; 
}

export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loop: boolean;
}

export interface AnimationControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  setTime: (time: number) => void;
  setLoop: (loop: boolean) => void;
}

export interface AnimationTimelineProps {
  keyframes: Keyframe[];
  state: AnimationState;
  controls: AnimationControls;
  onAddKeyframe: (settings: EffectSettings) => void;
  onUpdateKeyframe: (id: string, time: number, easing?: EasingType) => void;
  onDeleteKeyframe: (id: string) => void;
  onSelectKeyframe: (id: string) => void;
  selectedKeyframeId: string | null;
  onDurationChange?: (duration: number) => void;
} 