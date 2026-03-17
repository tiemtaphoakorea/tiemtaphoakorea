import * as React from "react";
import type { NumericFormatProps } from "react-number-format";
import { NumericFormat } from "react-number-format";
import { cn } from "@/lib/utils";

export interface NumberInputProps extends Omit<NumericFormatProps, "customInput"> {
  className?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, allowNegative = false, ...props }, ref) => {
    return (
      <NumericFormat
        getInputRef={ref}
        thousandSeparator="."
        decimalSeparator=","
        allowNegative={allowNegative}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-slate-800",
          className,
        )}
        {...props}
      />
    );
  },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
