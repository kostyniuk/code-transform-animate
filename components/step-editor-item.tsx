"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { CodeEditor } from "./code-editor";
import type { ShikiThemeChoice } from "@/app/lib/magicMove/shikiHighlighter";

interface StepEditorItemProps {
  index: number;
  code: string;
  onCodeChange: (code: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  language: string;
  theme: ShikiThemeChoice;
}

export function StepEditorItem({
  index,
  code,
  onCodeChange,
  onRemove,
  canRemove,
  language,
  theme,
}: StepEditorItemProps) {
  return (
    <div className="group relative">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs font-mono text-muted-foreground">
          Step {index + 1}
        </Label>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Code Editor */}
      <div className="relative">
        <CodeEditor
          language={language}
          theme={theme}
          value={code}
          onChange={onCodeChange}
          placeholder={`// Enter code for step ${index + 1}...`}
          className="bg-background"
          maxLines={40}
        />
      </div>
    </div>
  );
}
