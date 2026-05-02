"use client"

import { cn } from "@workspace/ui/lib/utils"
import { ChevronDownIcon } from "lucide-react"
import * as React from "react"

interface SelectProps extends Omit<React.ComponentProps<"select">, "onChange"> {
  onValueChange?: (value: string) => void
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, onValueChange, placeholder, children, ...props }, ref) => (
    <div data-slot="select" className={cn("relative flex", className)}>
      <select
        ref={ref}
        className="w-full cursor-pointer appearance-none rounded-sm border-[1.5px] border-input bg-background py-[7px] pr-8 pl-2.5 text-xs text-foreground transition-[border-color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15"
        onChange={(e) => onValueChange?.(e.target.value)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
)
Select.displayName = "Select"

function SelectOption(props: React.ComponentProps<"option">) {
  return <option {...props} />
}
SelectOption.displayName = "SelectOption"

export { Select, SelectOption }
