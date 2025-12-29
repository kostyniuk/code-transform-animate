"use client";

import { useState } from "react";
import { Download, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ExportControlsProps {
  stepCount: number;
  totalMs: number;
  transitionMs: number;
  onTransitionMsChange: (value: number) => void;
  downloadUrl: string | null;
  isExporting: boolean;
  exportPhase: "recording" | "saving" | null;
  exportProgress: number;
  onExport: (format: "webm" | "mp4") => void;
  canExport: boolean;
}

export function ExportControls({
  stepCount,
  totalMs,
  transitionMs,
  onTransitionMsChange,
  downloadUrl,
  isExporting,
  exportPhase,
  exportProgress,
  onExport,
  canExport,
}: ExportControlsProps) {
  const [format, setFormat] = useState<"webm" | "mp4">("webm");

  const statusText = exportPhase === "saving" ? "Preparing" : "Recording";

  return (
    <div className="flex-none p-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-muted/20 border-t">
      <div className="flex items-center gap-4">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">{stepCount}</span> steps · <span className="font-medium">{(totalMs / 1000).toFixed(1)}s</span> duration
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">Transition: {(transitionMs / 1000).toFixed(1)}s</Label>
          <Slider
            value={[transitionMs]}
            min={100}
            max={5000}
            step={100}
            onValueChange={([v]) => onTransitionMsChange(v)}
            className="w-40"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs whitespace-nowrap">Format:</Label>
        <Tabs
          value={format}
          onValueChange={(v) => setFormat(v as "webm" | "mp4")}
          className="w-fit"
        >
          <TabsList>
            <TabsTrigger value="webm">WebM</TabsTrigger>
            <TabsTrigger value="mp4">MP4</TabsTrigger>
          </TabsList>
        </Tabs>

        {downloadUrl && (
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href={downloadUrl} download={`magic-move.${format}`}>
              <Film className="w-4 h-4" />
              Save Video
            </a>
          </Button>
        )}
        <Button
          size="sm"
          className={cn("min-w-[100px]", isExporting && "opacity-80")}
          onClick={() => onExport(format)}
          disabled={!canExport || isExporting}
        >
          <Download className="w-4 h-4" />
          {isExporting ? `${statusText} ${Math.round(exportProgress * 100)}%` : "Export"}
        </Button>
      </div>
    </div>
  );
}

