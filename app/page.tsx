"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { animateLayouts } from "./lib/magicMove/animate"
import { drawCodeFrame } from "./lib/magicMove/canvasRenderer"
import { calculateCanvasHeight, layoutTokenLinesToCanvas, makeDefaultLayoutConfig } from "./lib/magicMove/codeLayout"
import type { LayoutResult } from "./lib/magicMove/codeLayout"
import { getThemeVariant, shikiTokenizeToLines, type ShikiThemeChoice } from "./lib/magicMove/shikiHighlighter"
import type { MagicMoveStep, SimpleStep } from "./lib/magicMove/types"
import { recordCanvasToWebm } from "./lib/video/recordCanvas"
import { convertWebmToMp4, terminateFFmpeg } from "./lib/video/converter"
import { DEFAULT_STEPS } from "./lib/constants"

import { ResizableHandle, ResizablePanelGroup } from "@/components/ui/resizable"
import { StepsEditor } from "@/components/steps-editor"
import { PreviewPanel } from "@/components/preview-panel"

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
  const [fps, setFps] = useState<number>(60);
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
  const [exportPhase, setExportPhase] = useState<"recording" | "saving" | null>(null);
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

  // Clear outdated download URL when settings change
  useEffect(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  }, [steps, theme, fps, transitionMs]); // Only those that affect the video content

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

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      terminateFFmpeg();
    };
  }, [downloadUrl]);

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



  // ... existing imports

  const onExport = async (format: "webm" | "mp4") => {
    if (!canvasRef.current) return;
    if (!stepLayouts || stepLayouts.length === 0) return;

    setIsExporting(true);
    setExportPhase("recording");
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
      let blob: Blob | null = await recordCanvasToWebm({
        canvas,
        fps,
        durationMs,
        onProgress: (elapsed, total) => {
          setExportProgress(total <= 0 ? 0 : elapsed / total);
        },
      });

      if (format === "mp4") {
        setExportPhase("saving");
        setExportProgress(0);

        const mp4Blob = await convertWebmToMp4(blob!, (val) => {
          setExportProgress(val);
        }, durationMs);
        cancelled = true;

        const url = URL.createObjectURL(mp4Blob);
        setDownloadUrl(url);
      } else {
        cancelled = true;
        const url = URL.createObjectURL(blob!);
        setDownloadUrl(url);
      }

      blob = null; // Release WebM blob memory

    } catch (e) {
      cancelled = true;
      setLayoutError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
      setExportPhase(null);
      setExportProgress(0);
      setPlayheadMs(0);
      renderAt(0);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1 w-full max-w-full">
        <StepsEditor
          steps={simpleSteps}
          selectedLang={selectedLang}
          onLangChange={setSelectedLang}
          theme={theme}
          onThemeChange={(v) => setTheme(v as ShikiThemeChoice)}
          showLineNumbers={simpleShowLineNumbers}
          onShowLineNumbersChange={setSimpleShowLineNumbers}
          startLine={simpleStartLine}
          onStartLineChange={setSimpleStartLine}
          fps={fps}
          onFpsChange={setFps}
          onAddStep={addSimpleStep}
          onRemoveStep={removeSimpleStep}
          onUpdateStep={updateSimpleStep}
        />

        <ResizableHandle withHandle />

        <PreviewPanel
          canvasRef={canvasRef}
          layoutError={layoutError}
          onDismissError={() => setLayoutError(null)}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          playheadMs={playheadMs}
          totalMs={timeline.totalMs}
          onSeek={setPlayheadMs}
          onReset={() => {
            setIsPlaying(false);
            setPlayheadMs(0);
          }}
          stepLayouts={stepLayouts}
          stepCount={steps.length}
          transitionMs={transitionMs}
          onTransitionMsChange={setTransitionMs}
          downloadUrl={downloadUrl}
          isExporting={isExporting}
          exportPhase={exportPhase}
          exportProgress={exportProgress}
          onExport={onExport}
          canExport={canExport}
        />
      </ResizablePanelGroup>
    </div>
  );
}
