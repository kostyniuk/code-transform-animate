"use client";

import { Layers, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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

function formatName(name: string) {
  return name
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
        <Combobox
          items={AVAILABLE_LANGUAGES}
          value={selectedLang}
          onValueChange={(v) => v && onLangChange(v as string)}
          itemToStringLabel={(value) => formatName(value as string)}
        >
          <ComboboxInput placeholder="Select a language..." className="h-8 w-[140px] text-xs" />
          <ComboboxContent>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {formatName(item)}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Combobox
          value={theme}
          onValueChange={(v) => v && onThemeChange(v as ShikiThemeChoice)}
          itemToStringLabel={(value) => formatName(value as string)}
        >
          <ComboboxInput placeholder="Select theme..." className="h-8 w-[140px] text-xs" />
          <ComboboxContent>
            <ComboboxList>
              {AVAILABLE_THEMES.map((t) => (
                <ComboboxItem key={t} value={t} className="text-xs">
                  {formatName(t)}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Separator orientation="vertical" className="h-6" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings2 className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 mt-1">
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

        <Button onClick={onAddStep} size="sm" className="h-7 gap-1" variant="default">
          <Plus className="w-3.5 h-3.5" /> New Step
        </Button>
      </div>
    </div>
  );
}

