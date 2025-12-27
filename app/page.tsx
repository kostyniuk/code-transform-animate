"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Plus,
  Trash2,
  Settings2,
  Layers,
  Film,
  X
} from "lucide-react"

import { animateLayouts } from "./lib/magicMove/animate"
import { drawCodeFrame } from "./lib/magicMove/canvasRenderer"
import { calculateCanvasHeight, layoutTokenLinesToCanvas, makeDefaultLayoutConfig } from "./lib/magicMove/codeLayout"
import type { LayoutResult } from "./lib/magicMove/codeLayout"
import { AVAILABLE_LANGUAGES, AVAILABLE_THEMES, getThemeVariant, shikiTokenizeToLines, type ShikiThemeChoice } from "./lib/magicMove/shikiHighlighter"
import type { MagicMoveStep, SimpleStep } from "./lib/magicMove/types"
import { recordCanvasToWebm } from "./lib/video/recordCanvas"
import { DEFAULT_STEPS } from "./lib/constants"

// Shadcn UI Imports
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type StepLayout = {
  layout: LayoutResult;
  tokenLineCount: number;
  startLine: number;
  showLineNumbers: boolean;
};

export default function Home() {

  const [simpleSteps, setSimpleSteps] = useState<SimpleStep[]>(DEFAULT_STEPS);
  const [selectedLang, setSelectedLang] = useState<string>("typescript");
  const [simpleShowLineNumbers, setSimpleShowLineNumbers] = useState<boolean>(true);
  const [simpleStartLine, setSimpleStartLine] = useState<number>(1);

  const [theme, setTheme] = useState<ShikiThemeChoice>("vitesse-dark");
  const [fps, setFps] = useState<number>(30);
  const [transitionMs, setTransitionMs] = useState<number>(800);

  // Compute steps from simple mode
  const steps = useMemo<MagicMoveStep[]>(() => {
    return simpleSteps.map((step) => ({
      lang: selectedLang,
      code: step.code,
      meta: {
        lines: simpleShowLineNumbers,
        startLine: simpleStartLine,
      },
    }));
  }, [simpleSteps, selectedLang, simpleShowLineNumbers, simpleStartLine]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stepLayouts, setStepLayouts] = useState<StepLayout[] | null>(null);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadMs, setPlayheadMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const timeline = useMemo(() => {
    const stepCount = steps.length;
    const startHold = 250;
    const betweenHold = 120;
    const endHold = 250;
    if (stepCount <= 1) return { totalMs: startHold + endHold, startHold, betweenHold, endHold };
    const transitions = stepCount - 1;
    const totalMs = startHold + transitions * transitionMs + transitions * betweenHold + endHold;
    return { totalMs, startHold, betweenHold, endHold };
  }, [steps.length, transitionMs]);

  useEffect(() => {
    let cancelled = false;
    setLayoutError(null);
    setStepLayouts(null);

    (async () => {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D not supported");

      const nextLayouts: StepLayout[] = [];
      for (const step of steps) {
        const { lines, bg } = await shikiTokenizeToLines({
          code: step.code,
          lang: step.lang,
          theme,
        });

        const cfg = makeDefaultLayoutConfig();
        cfg.showLineNumbers = step.meta.lines;
        cfg.startLine = step.meta.startLine;

        const layout = layoutTokenLinesToCanvas({
          ctx,
          tokenLines: lines,
          bg,
          theme: getThemeVariant(theme),
          config: cfg,
        });

        nextLayouts.push({
          layout,
          tokenLineCount: lines.length,
          startLine: cfg.startLine,
          showLineNumbers: cfg.showLineNumbers,
        });
      }

      if (cancelled) return;
      setStepLayouts(nextLayouts);
    })().catch((e: unknown) => {
      if (cancelled) return;
      setLayoutError(e instanceof Error ? e.message : "Failed to build preview");
    });

    return () => {
      cancelled = true;
    };
  }, [steps, theme]);

  const renderAt = useCallback(
    (ms: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !stepLayouts || stepLayouts.length === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cfg = makeDefaultLayoutConfig();
      canvas.width = cfg.canvasWidth;

      // Calculate dynamic height based on maximum line count across all steps
      const maxLineCount = Math.max(...stepLayouts.map((s) => s.tokenLineCount));
      const calculatedHeight = calculateCanvasHeight({
        lineCount: maxLineCount,
        lineHeight: cfg.lineHeight,
        paddingY: cfg.paddingY,
        minHeight: 1080, // Minimum Full HD height
      });
      // Only update height if it's different (avoids unnecessary resets during export)
      if (canvas.height !== calculatedHeight) {
        canvas.height = calculatedHeight;
      }
      // Ensure renderer config matches actual canvas size (otherwise drawCodeFrame clips)
      cfg.canvasHeight = canvas.height;

      const clampMs = Math.max(0, Math.min(timeline.totalMs, ms));

      const steps = stepLayouts.length;
      if (steps === 1) {
        const only = stepLayouts[0]!;
        drawCodeFrame({
          ctx,
          config: cfg,
          layout: only.layout,
          theme: getThemeVariant(theme),
          showLineNumbers: only.showLineNumbers,
          startLine: only.startLine,
          lineCount: only.tokenLineCount,
        });
        return;
      }

      let t = clampMs;
      if (t < timeline.startHold) {
        const first = stepLayouts[0]!;
        drawCodeFrame({
          ctx,
          config: cfg,
          layout: first.layout,
          theme: getThemeVariant(theme),
          showLineNumbers: first.showLineNumbers,
          startLine: first.startLine,
          lineCount: first.tokenLineCount,
        });
        return;
      }
      t -= timeline.startHold;

      for (let i = 0; i < steps - 1; i++) {
        const a = stepLayouts[i]!;
        const b = stepLayouts[i + 1]!;

        if (t <= transitionMs) {
          const progress = transitionMs <= 0 ? 1 : t / transitionMs;
          const animated = animateLayouts({ from: a.layout, to: b.layout, progress });
          drawCodeFrame({
            ctx,
            config: cfg,
            layout: b.layout,
            theme: getThemeVariant(theme),
            tokens: animated,
            showLineNumbers: a.showLineNumbers || b.showLineNumbers,
            startLine: b.startLine,
            lineCount: b.tokenLineCount,
          });
          return;
        }

        t -= transitionMs;
        if (t <= timeline.betweenHold) {
          drawCodeFrame({
            ctx,
            config: cfg,
            layout: b.layout,
            theme: getThemeVariant(theme),
            showLineNumbers: b.showLineNumbers,
            startLine: b.startLine,
            lineCount: b.tokenLineCount,
          });
          return;
        }
        t -= timeline.betweenHold;
      }

      const last = stepLayouts[steps - 1]!;
      drawCodeFrame({
        ctx,
        config: cfg,
        layout: last.layout,
        theme: getThemeVariant(theme),
        showLineNumbers: last.showLineNumbers,
        startLine: last.startLine,
        lineCount: last.tokenLineCount,
      });
    },
    [stepLayouts, theme, timeline, transitionMs]
  );

  useEffect(() => {
    renderAt(playheadMs);
  }, [playheadMs, renderAt]);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
      return;
    }

    const tick = (now: number) => {
      const last = lastFrameRef.current ?? now;
      lastFrameRef.current = now;
      const dt = now - last;
      setPlayheadMs((t) => {
        const next = t + dt;
        return next >= timeline.totalMs ? 0 : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
      return;
    };
  }, [isPlaying, timeline.totalMs]);

  const canExport = !!canvasRef.current && !!stepLayouts && stepLayouts.length > 0;

  // Simple mode handlers
  const addSimpleStep = () => {
    setSimpleSteps([...simpleSteps, { code: `// Step ${simpleSteps.length + 1}` }]);
  };

  const removeSimpleStep = (index: number) => {
    if (simpleSteps.length <= 1) return; // Keep at least one step
    setSimpleSteps(simpleSteps.filter((_, i) => i !== index));
  };

  const updateSimpleStep = (index: number, code: string) => {
    const updated = [...simpleSteps];
    updated[index] = { code };
    setSimpleSteps(updated);
  };

  const onExport = async () => {
    if (!canvasRef.current) return;
    if (!stepLayouts || stepLayouts.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);

    const canvas = canvasRef.current;
    const cfg = makeDefaultLayoutConfig();

    // Calculate and set fixed canvas height for export (based on max line count)
    const maxLineCount = Math.max(...stepLayouts.map((s) => s.tokenLineCount));
    const exportHeight = calculateCanvasHeight({
      lineCount: maxLineCount,
      lineHeight: cfg.lineHeight,
      paddingY: cfg.paddingY,
      minHeight: 1080,
    });
    canvas.width = cfg.canvasWidth;
    canvas.height = exportHeight;

    const durationMs = timeline.totalMs;
    const start = performance.now();
    let cancelled = false;

    const renderLoop = () => {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      renderAt(elapsed);
      if (elapsed < durationMs) requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);

    try {
      const blob = await recordCanvasToWebm({
        canvas,
        fps,
        durationMs,
        onProgress: (elapsed, total) => setExportProgress(total <= 0 ? 0 : elapsed / total),
      });
      cancelled = true;

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (e) {
      cancelled = true;
      setLayoutError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setPlayheadMs(0);
      renderAt(0);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">

      {/* Header - Very Compact */}
      <header className="flex-none h-14 border-b flex items-center justify-between px-4 bg-background z-20">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Code Animation Studio
          </h1>
        </div>
      </header>

      {/* Main Content Resizable Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 w-full max-w-full">

        {/* Left Panel: Steps Editor (PRIORITY 1) */}
        <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col h-full bg-muted/10 overflow-hidden">
          <div className="flex-none flex items-center justify-between px-4 py-2 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10 gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Steps</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{simpleSteps.length}</span>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end">
              <Select value={selectedLang} onValueChange={setSelectedLang}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={theme} onValueChange={(v) => setTheme(v as ShikiThemeChoice)}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_THEMES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t === "github-light" ? "GitHub Light" :
                        t === "github-dark" ? "GitHub Dark" :
                          t === "nord" ? "Nord" :
                            t === "one-dark-pro" ? "One Dark Pro" :
                              t === "vitesse-dark" ? "Vitesse Dark" :
                                t === "vitesse-light" ? "Vitesse Light" : t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-6" />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Configuration</h4>
                    <p className="text-sm text-muted-foreground">Adjust rendering settings.</p>

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="line-numbers">Line Numbers</Label>
                        <Switch
                          id="line-numbers"
                          checked={simpleShowLineNumbers}
                          onCheckedChange={setSimpleShowLineNumbers}
                        />
                      </div>
                      {simpleShowLineNumbers && (
                        <div className="flex items-center justify-between gap-4">
                          <Label htmlFor="start-line" className="text-xs">Start Line</Label>
                          <Input
                            id="start-line"
                            type="number"
                            className="h-8 w-20 text-right"
                            min={1}
                            value={simpleStartLine}
                            onChange={(e) => setSimpleStartLine(Math.max(1, Number(e.target.value) || 1))}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>FPS: {fps}</Label>
                      <Slider
                        value={[fps]}
                        min={10}
                        max={60}
                        step={5}
                        onValueChange={([v]) => setFps(v)}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button onClick={addSimpleStep} size="sm" className="h-7 gap-1" variant="secondary">
                <Plus className="w-3.5 h-3.5" /> New Step
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 w-full min-h-0">
            <div className="p-4 space-y-6 max-w-4xl mx-auto pb-10">
              {simpleSteps.map((step, index) => (
                <div key={index} className="group relative">
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-mono text-muted-foreground">
                      Step {index + 1}
                    </Label>
                    {simpleSteps.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => removeSimpleStep(index)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Simplified Step Card/Textarea */}
                  <div className="relative">
                    <Textarea
                      className="min-h-[250px] font-mono text-sm leading-relaxed p-4 resize-y bg-background focus-visible:ring-primary/20"
                      value={step.code}
                      onChange={(e) => updateSimpleStep(index, e.target.value)}
                      spellCheck={false}
                      placeholder={`// Enter code for step ${index + 1}...`}
                    />
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full border-dashed text-muted-foreground" onClick={addSimpleStep}>
                <Plus className="w-4 h-4 mr-2" /> Add another step
              </Button>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Preview & Player (PRIORITY 2/3) */}
        <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-zinc-950/5 dark:bg-black">

          {/* Top: Preview Canvas */}
          <div className="flex-1 relative min-h-0 flex flex-col">
            {layoutError && (
              <div className="absolute top-4 left-4 right-4 z-50 bg-destructive/10 text-destructive border border-destructive/20 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
                <span>{layoutError}</span>
                <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-destructive/20" onClick={() => setLayoutError(null)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Canvas Container */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[url('/grid-pattern.svg')] dark:bg-[url('/grid-pattern-dark.svg')] bg-center">
              <div className="relative shadow-2xl rounded-lg overflow-hidden ring-1 ring-black/5 dark:ring-white/10 bg-zinc-950 max-w-full">
                <canvas
                  ref={canvasRef}
                  className="block max-w-full h-auto"
                />
              </div>
            </div>
          </div>

          {/* Player Bar (Compact) */}
          <div className="flex-none border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 flex items-center gap-4">
            <Button
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!stepLayouts}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </Button>

            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span className="font-mono">{Math.round(playheadMs)}ms</span>
                <span className="font-mono">{Math.round(timeline.totalMs)}ms</span>
              </div>
              {/* Custom progress Slider concept */}
              <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  if (!stepLayouts) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  setPlayheadMs(percent * timeline.totalMs);
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-primary transition-all duration-75 ease-linear"
                  style={{ width: `${(playheadMs / Math.max(1, timeline.totalMs)) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => {
                  setIsPlaying(false);
                  setPlayheadMs(0);
                }}
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bottom Actions (Download) */}
          <div className="flex-none p-4 flex items-center justify-between gap-4 bg-muted/20 border-t">
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{steps.length}</span> steps · <span className="font-medium">{(timeline.totalMs / 1000).toFixed(1)}s</span> duration
              </div>

              <div className="flex items-center gap-3">
                <Label className="text-xs whitespace-nowrap">Transition: {transitionMs}ms</Label>
                <Slider
                  value={[transitionMs]}
                  min={100}
                  max={5000}
                  step={100}
                  onValueChange={([v]) => setTransitionMs(v)}
                  className="w-[200px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {downloadUrl && (
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <a href={downloadUrl} download="magic-move.webm">
                    <Film className="w-4 h-4" />
                    Save Video
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                className={cn("gap-2 min-w-[120px]", isExporting && "opacity-80")}
                onClick={onExport}
                disabled={!canExport || isExporting}
              >
                <Download className="w-4 h-4" />
                {isExporting ? `Processing ${Math.round(exportProgress * 100)}%` : "Export"}
              </Button>
            </div>
          </div>

        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}
