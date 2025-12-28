"use client";

import { Layers, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AVAILABLE_LANGUAGES, AVAILABLE_THEMES, type ShikiThemeChoice } from "@/app/lib/magicMove/shikiHighlighter";
import { SettingsPopover } from "./settings-popover";

interface StepsEditorHeaderProps {
  stepCount: number;
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
}

export function StepsEditorHeader({
  stepCount,
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
}: StepsEditorHeaderProps) {
  return (
    <div className="flex-none flex items-center justify-between px-4 py-2 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10 gap-2">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <span className="font-semibold text-sm">Steps</span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{stepCount}</span>
      </div>

      <div className="flex items-center gap-2 flex-1 justify-end">
        <Select value={selectedLang} onValueChange={onLangChange}>
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

        <Select value={theme} onValueChange={(v) => onThemeChange(v as ShikiThemeChoice)}>
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
            <SettingsPopover
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
            />
          </PopoverContent>
        </Popover>

        <Button onClick={onAddStep} size="sm" className="h-7 gap-1" variant="secondary">
          <Plus className="w-3.5 h-3.5" /> New Step
        </Button>
      </div>
    </div>
  );
}

