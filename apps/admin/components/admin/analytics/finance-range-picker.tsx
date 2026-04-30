"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";

export type DateRange = { startDate: string; endDate: string };

type Preset = "today" | "yesterday" | "7days" | "thisMonth" | "lastMonth" | "month" | "custom";

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function presetToRange(preset: Preset, monthYear?: { month: number; year: number }): DateRange {
  const now = new Date();
  switch (preset) {
    case "today":
      return { startDate: toISO(now), endDate: toISO(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { startDate: toISO(y), endDate: toISO(y) };
    }
    case "7days": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { startDate: toISO(s), endDate: toISO(now) };
    }
    case "thisMonth":
      return {
        startDate: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: toISO(now),
      };
    case "lastMonth": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: toISO(first), endDate: toISO(last) };
    }
    case "month": {
      const m = monthYear?.month ?? now.getMonth() + 1;
      const y = monthYear?.year ?? now.getFullYear();
      const first = new Date(y, m - 1, 1);
      const last = new Date(y, m, 0);
      return { startDate: toISO(first), endDate: toISO(last) };
    }
    default:
      return { startDate: toISO(now), endDate: toISO(now) };
  }
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Hôm nay" },
  { key: "yesterday", label: "Hôm qua" },
  { key: "7days", label: "7 ngày" },
  { key: "thisMonth", label: "Tháng này" },
  { key: "lastMonth", label: "Tháng trước" },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Tháng ${i + 1}`,
}));
const YEARS = [2024, 2025, 2026];

interface FinanceRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function FinanceRangePicker({ value, onChange }: FinanceRangePickerProps) {
  const now = new Date();
  const [activePreset, setActivePreset] = useState<Preset>("thisMonth");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [customFrom, setCustomFrom] = useState(value.startDate);
  const [customTo, setCustomTo] = useState(value.endDate);

  function selectPreset(preset: Preset) {
    setActivePreset(preset);
    if (preset !== "month" && preset !== "custom") {
      onChange(presetToRange(preset));
    }
  }

  function applyMonth() {
    setActivePreset("month");
    onChange(presetToRange("month", { month, year }));
  }

  function applyCustom() {
    if (customFrom && customTo && customFrom <= customTo) {
      setActivePreset("custom");
      onChange({ startDate: customFrom, endDate: customTo });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => selectPreset(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold transition-colors",
              activePreset === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="h-8 w-32 text-xs font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="h-8 w-24 text-xs font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)} className="text-xs">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={applyMonth}>
          Xem tháng
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={customFrom}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="h-8 w-36 text-xs"
        />
        <span className="text-xs text-slate-500">→</span>
        <Input
          type="date"
          value={customTo}
          onChange={(e) => setCustomTo(e.target.value)}
          className="h-8 w-36 text-xs"
        />
        <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={applyCustom}>
          Áp dụng
        </Button>
      </div>
    </div>
  );
}
