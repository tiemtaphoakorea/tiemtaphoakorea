"use client";

import { cn } from "@workspace/ui/lib/utils";
import * as React from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";

const inputClassName =
  "w-full min-w-0 rounded-sm border-[1.5px] border-input bg-background px-2.5 py-[7px] text-xs text-foreground transition-[border-color,box-shadow,background-color] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/40 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-destructive-soft aria-invalid:ring-3 aria-invalid:ring-destructive/15 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export type NumberInputProps = Omit<
  NumericFormatProps,
  "thousandSeparator" | "decimalSeparator" | "allowedDecimalSeparators" | "customInput"
> & {
  allowNegative?: boolean;
};

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, allowNegative = false, decimalScale, max, min, onValueChange, ...props }, ref) => {
    const isAllowed: NumericFormatProps["isAllowed"] = (values) => {
      if (!allowNegative) {
        if (values.value === "-" || values.value.startsWith("-")) return false;
        const { floatValue } = values;
        if (floatValue !== undefined && floatValue < 0) return false;
      }
      return true;
    };

    const maxN = max !== undefined ? Number(max) : undefined;
    const minN = min !== undefined ? Number(min) : undefined;

    const handleValueChange: NumericFormatProps["onValueChange"] = (values, sourceInfo) => {
      let next = values;
      if (
        maxN !== undefined &&
        !Number.isNaN(maxN) &&
        values.floatValue !== undefined &&
        values.floatValue > maxN
      ) {
        next = { ...values, floatValue: maxN, value: String(maxN) };
      }
      if (
        minN !== undefined &&
        !Number.isNaN(minN) &&
        values.floatValue !== undefined &&
        values.floatValue < minN
      ) {
        next = { ...values, floatValue: minN, value: String(minN) };
      }
      onValueChange?.(next, sourceInfo);
    };

    return (
      <NumericFormat
        getInputRef={ref}
        thousandSeparator="."
        decimalSeparator=","
        allowedDecimalSeparators={[","]}
        data-slot="number-input"
        className={cn(inputClassName, className)}
        isAllowed={isAllowed}
        decimalScale={decimalScale}
        onValueChange={handleValueChange}
        {...props}
      />
    );
  },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
