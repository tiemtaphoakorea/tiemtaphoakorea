"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { useEffect, useState } from "react";

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

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

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
  const [monthOpen, setMonthOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  useEffect(() => {
    setCustomFrom(value.startDate);
    setCustomTo(value.endDate);
  }, [value.startDate, value.endDate]);

  function selectPreset(preset: Preset) {
    setActivePreset(preset);
    onChange(presetToRange(preset));
  }

  function applyMonth() {
    setActivePreset("month");
    onChange(presetToRange("month", { month, year }));
    setMonthOpen(false);
  }

  function applyCustom() {
    if (customFrom && customTo && customFrom <= customTo) {
      setActivePreset("custom");
      onChange({ startDate: customFrom, endDate: customTo });
      setCustomOpen(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map(({ key, label }) => (
        <Button
          key={key}
          size="sm"
          variant={activePreset === key ? "default" : "outline"}
          className="h-7 rounded-full px-3 text-xs font-bold"
          onClick={() => selectPreset(key)}
        >
          {label}
        </Button>
      ))}

      <Popover open={monthOpen} onOpenChange={setMonthOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={activePreset === "month" ? "default" : "outline"}
            className="h-7 rounded-full px-3 text-xs font-bold"
          >
            Tháng cụ thể
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Select
                value={String(month)}
                onValueChange={(v) => setMonth(Number(v))}
                className="h-8 flex-1 text-xs font-bold"
              >
                {MONTHS.map((m) => (
                  <SelectOption key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectOption>
                ))}
              </Select>
              <Select
                value={String(year)}
                onValueChange={(v) => setYear(Number(v))}
                className="h-8 w-20 text-xs font-bold"
              >
                {YEARS.map((y) => (
                  <SelectOption key={y} value={String(y)}>
                    {y}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <Button size="sm" className="h-8 w-full text-xs font-bold" onClick={applyMonth}>
              Áp dụng
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={activePreset === "custom" ? "default" : "outline"}
            className="h-7 rounded-full px-3 text-xs font-bold"
          >
            Tùy chỉnh
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">→</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <Button size="sm" className="h-8 w-full text-xs font-bold" onClick={applyCustom}>
              Áp dụng
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
