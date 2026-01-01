"use client";

import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

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
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </Button>

      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span className="font-mono">{Math.round(playheadMs)}ms</span>
          <span className="font-mono">{Math.round(totalMs)}ms</span>
        </div>
        <Slider
          value={[playheadMs]}
          max={Math.max(1, totalMs)}
          step={1}
          onValueChange={([value]) => onSeek(value)}
          disabled={disabled}
          className="py-1"
          noThumb
        />
      </div>

      <div className="flex items-center gap-2 pl-1">
        <Separator orientation="vertical" className="h-8" />
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
