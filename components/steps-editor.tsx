"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "@/components/ui/resizable";
import { StepsEditorHeader } from "./steps-editor-header";
import { StepEditorItem } from "./step-editor-item";
import type { SimpleStep } from "@/app/lib/magicMove/types";
import type { ShikiThemeChoice } from "@/app/lib/magicMove/shikiHighlighter";

interface StepsEditorProps {
  steps: SimpleStep[];
  selectedLang: string;
  onLangChange: (lang: string) => void;
  theme: ShikiThemeChoice;
  onThemeChange: (theme: ShikiThemeChoice) => void;
  showLineNumbers: boolean;
  onShowLineNumbersChange: (checked: boolean) => void;
  startLine: number;
  onStartLineChange: (value: number) => void;
  fps: number;
  onFpsChange: (value: number) => void;
  startHoldMs: number;
  onStartHoldMsChange: (value: number) => void;
  betweenHoldMs: number;
  onBetweenHoldMsChange: (value: number) => void;
  endHoldMs: number;
  onEndHoldMsChange: (value: number) => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onUpdateStep: (index: number, code: string) => void;
}

export function StepsEditor({
  steps,
  selectedLang,
  onLangChange,
  theme,
  onThemeChange,
  showLineNumbers,
  onShowLineNumbersChange,
  startLine,
  onStartLineChange,
  fps,
  onFpsChange,
  startHoldMs,
  onStartHoldMsChange,
  betweenHoldMs,
  onBetweenHoldMsChange,
  endHoldMs,
  onEndHoldMsChange,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
}: StepsEditorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [steps.length]);

  return (
    <ResizablePanel defaultSize={60} minSize={35} className="flex flex-col h-full bg-muted/10 overflow-hidden">
      <StepsEditorHeader
        stepCount={steps.length}
        selectedLang={selectedLang}
        onLangChange={onLangChange}
        theme={theme}
        onThemeChange={onThemeChange}
        showLineNumbers={showLineNumbers}
        onShowLineNumbersChange={onShowLineNumbersChange}
        startLine={startLine}
        onStartLineChange={onStartLineChange}
        fps={fps}
        onFpsChange={onFpsChange}
        startHoldMs={startHoldMs}
        onStartHoldMsChange={onStartHoldMsChange}
        betweenHoldMs={betweenHoldMs}
        onBetweenHoldMsChange={onBetweenHoldMsChange}
        endHoldMs={endHoldMs}
        onEndHoldMsChange={onEndHoldMsChange}
        onAddStep={onAddStep}
      />

      <ScrollArea
        ref={scrollRef}
        className="flex-1 w-full min-h-0"
      >
        <div className="p-4 space-y-6 max-w-4xl mx-auto w-full pb-10">
          {steps.map((step, index) => (
            <StepEditorItem
              key={index}
              index={index}
              code={step.code}
              onCodeChange={(code) => onUpdateStep(index, code)}
              onRemove={() => onRemoveStep(index)}
              canRemove={steps.length > 1}
              language={selectedLang}
              theme={theme}
            />
          ))}

          <Button variant="outline" className="w-full border-dashed text-muted-foreground" onClick={onAddStep}>
            <Plus className="w-4 h-4 mr-2" /> Add another step
          </Button>
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
}

