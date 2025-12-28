"use client";

import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  playheadMs: number;
  totalMs: number;
  onSeek: (ms: number) => void;
  onReset: () => void;
  disabled?: boolean;
}

export function PlayerControls({
  isPlaying,
  onPlayPause,
  playheadMs,
  totalMs,
  onSeek,
  onReset,
  disabled = false,
}: PlayerControlsProps) {
  return (
    <div className="flex-none border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 flex items-center gap-4">
      <Button
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full"
        onClick={onPlayPause}
        disabled={disabled}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
      </Button>

      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span className="font-mono">{Math.round(playheadMs)}ms</span>
          <span className="font-mono">{Math.round(totalMs)}ms</span>
        </div>
        {/* Custom progress Slider concept */}
        <div
          className="relative h-2 w-full bg-secondary rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            if (disabled) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            onSeek(percent * totalMs);
          }}
        >
          <div
            className="absolute inset-y-0 left-0 bg-primary"
            style={{
              width: `${(playheadMs / Math.max(1, totalMs)) * 100}%`,
              willChange: "width"
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pl-2 border-l">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={onReset}
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

