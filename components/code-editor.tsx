"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  shikiTokenizeToLines,
  type ShikiThemeChoice,
  type TokenLine,
  getThemeVariant,
} from "@/app/lib/magicMove/shikiHighlighter";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme: ShikiThemeChoice;
  className?: string;
  placeholder?: string;
  maxHeight?: number;
  maxLines?: number;
}

export function CodeEditor({
  value,
  onChange,
  language,
  theme,
  className,
  placeholder,
  maxHeight = 320,
  maxLines,
}: CodeEditorProps) {
  const [lines, setLines] = useState<TokenLine[] | null>(null);
  const [bg, setBg] = useState<string>("transparent");
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const variant = getThemeVariant(theme);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      shikiTokenizeToLines({ code: value, lang: language, theme }).then((res) => {
        if (!cancelled) {
          setLines(res.lines);
          setBg(res.bg);
        }
      });
    }, 20); // 20ms debounce
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, language, theme]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScroll({
      top: e.currentTarget.scrollTop,
      left: e.currentTarget.scrollLeft,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLines) {
      const lines = newValue.split("\n");
      if (lines.length > maxLines) {
        onChange(lines.slice(0, maxLines).join("\n"));
        return;
      }
    }
    onChange(newValue);
  };

  const lineCount = value.split("\n").length;
  const isOverLimit = maxLines && lineCount >= maxLines;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div
        className={cn(
          "relative font-mono text-sm leading-relaxed rounded-md overflow-hidden border transition-colors focus-within:ring-2 focus-within:ring-primary/20",
          isOverLimit ? "border-warning/50" : "",
          className,
        )}
        style={{ maxHeight }}
      >
        {/* Highlighting layer */}
        <div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ backgroundColor: bg }}
        >
          <div
            className="p-4 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed"
            style={{
              transform: `translate(${-scroll.left}px, ${-scroll.top}px)`,
              willChange: "transform",
            }}
          >
            {lines ? (
              lines.map((line, i) => (
                <div key={i} className="min-h-[1.5em]">
                  {line.tokens.map((token, j) => (
                    <span key={j} style={{ color: token.color }}>
                      {token.content}
                    </span>
                  ))}
                  {line.tokens.length === 0 && <br />}
                </div>
              ))
            ) : (
              <div className="opacity-50 whitespace-pre-wrap">{value}</div>
            )}
          </div>
        </div>

        {/* Editing layer */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          spellCheck={false}
          placeholder={placeholder}
          style={{
            caretColor: variant === "dark" ? "white" : "black",
            height: maxHeight,
            maxHeight,
          }}
          className="relative z-10 block w-full p-4 m-0 bg-transparent text-transparent resize-none outline-none border-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words placeholder:text-muted-foreground/50 focus:ring-0 overflow-auto"
        />
      </div>
      {maxLines && (
        <div
          className={cn(
            "text-[10px] font-mono self-end px-1 transition-colors",
            isOverLimit ? "text-warning animate-pulse" : "text-muted-foreground/50",
          )}
        >
          {lineCount}/{maxLines} lines
        </div>
      )}
    </div>
  );
}
