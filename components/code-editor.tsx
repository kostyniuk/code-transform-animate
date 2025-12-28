"use client";

import React, { useEffect, useState, useRef } from "react";
import { shikiTokenizeToLines, type ShikiThemeChoice, type TokenLine, getThemeVariant } from "@/app/lib/magicMove/shikiHighlighter";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: string;
    theme: ShikiThemeChoice;
    className?: string;
    placeholder?: string;
}

export function CodeEditor({
    value,
    onChange,
    language,
    theme,
    className,
    placeholder,
}: CodeEditorProps) {
    const [lines, setLines] = useState<TokenLine[] | null>(null);
    const [bg, setBg] = useState<string>("transparent");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);

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
        }, 50); // 50ms debounce
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [value, language, theme]);

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    // Ensure we sync scroll on every render if needed
    useEffect(() => {
        if (textareaRef.current && preRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    });

    return (
        <div className={cn("relative font-mono text-sm leading-relaxed rounded-md overflow-hidden border transition-colors focus-within:ring-2 focus-within:ring-primary/20", className)}>
            {/* Highlighting layer */}
            <pre
                ref={preRef}
                aria-hidden="true"
                className="absolute inset-0 p-4 m-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words border-none font-mono text-sm leading-relaxed"
                style={{ backgroundColor: bg }}
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
            </pre>

            {/* Editing layer */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                spellCheck={false}
                placeholder={placeholder}
                style={{ caretColor: variant === "dark" ? "white" : "black" }}
                className="relative z-10 block w-full h-full min-h-[250px] p-4 m-0 bg-transparent text-transparent resize-y outline-none border-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words placeholder:text-muted-foreground/50 focus:ring-0"
            />
        </div>
    );
}


