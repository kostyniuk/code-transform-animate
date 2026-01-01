"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldLegend,
  FieldSet,
  FieldDescription,
} from "@/components/ui/field";
import { MinusIcon, PlusIcon } from "lucide-react";

interface SettingsPopoverProps {
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
}

export function SettingsPopover({
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
}: SettingsPopoverProps) {
  return (
    <div className="space-y-4">
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Configuration</FieldLegend>
          <FieldDescription>Adjust rendering settings</FieldDescription>

          <Separator />

          <FieldGroup>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Line Numbers
            </Label>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="line-numbers">Show Line Numbers</FieldLabel>
              <Switch
                id="line-numbers"
                checked={showLineNumbers}
                onCheckedChange={onShowLineNumbersChange}
              />
            </Field>
            {showLineNumbers && (
              <Field orientation="horizontal">
                <FieldLabel htmlFor="number-of-gpus-f6l">Start Line</FieldLabel>
                <ButtonGroup>
                  <Input
                    id="number-of-gpus-f6l"
                    value={startLine}
                    onChange={(e) => onStartLineChange(Number(e.target.value))}
                    size={3}
                    className="h-8 !w-14 font-mono"
                    maxLength={3}
                  />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    aria-label="Decrement"
                    onClick={() => onStartLineChange(startLine - 1)}
                    disabled={startLine <= 1}
                  >
                    <MinusIcon />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    type="button"
                    aria-label="Increment"
                    onClick={() => onStartLineChange(startLine + 1)}
                    disabled={startLine >= 999}
                  >
                    <PlusIcon />
                  </Button>
                </ButtonGroup>
              </Field>
            )}
          </FieldGroup>

          <Separator />

          <FieldGroup className="pt-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Video
            </Label>
            <Field orientation="horizontal">
              <FieldLabel>FPS</FieldLabel>
              <Tabs
                value={fps.toString()}
                onValueChange={(v) => onFpsChange(Number(v))}
                className="w-fit"
              >
                <TabsList>
                  <TabsTrigger value="30">30</TabsTrigger>
                  <TabsTrigger value="60">60</TabsTrigger>
                </TabsList>
              </Tabs>
            </Field>
          </FieldGroup>

          <Separator />

          <FieldGroup className="pt-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Timing (ms)
            </Label>

            <Field>
              <div className="flex justify-between items-center">
                <FieldLabel className="text-xs">Start Rest</FieldLabel>
                <FieldLabel className="text-xs text-muted-foreground font-mono">
                  {startHoldMs}ms
                </FieldLabel>
              </div>
              <Slider
                value={[startHoldMs]}
                min={0}
                max={2000}
                step={50}
                onValueChange={([v]) => onStartHoldMsChange(v)}
              />
            </Field>

            <Field>
              <div className="flex justify-between items-center">
                <FieldLabel className="text-xs">Between Rest</FieldLabel>
                <FieldLabel className="text-xs text-muted-foreground font-mono">
                  {betweenHoldMs}ms
                </FieldLabel>
              </div>
              <Slider
                value={[betweenHoldMs]}
                min={0}
                max={2000}
                step={50}
                onValueChange={([v]) => onBetweenHoldMsChange(v)}
              />
            </Field>

            <Field>
              <div className="flex justify-between items-center">
                <FieldLabel className="text-xs">End Rest</FieldLabel>
                <FieldLabel className="text-xs text-muted-foreground font-mono">
                  {endHoldMs}ms
                </FieldLabel>
              </div>
              <Slider
                value={[endHoldMs]}
                min={0}
                max={2000}
                step={50}
                onValueChange={([v]) => onEndHoldMsChange(v)}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </div>
  );
}
