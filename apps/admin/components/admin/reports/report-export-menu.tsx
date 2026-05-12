"use client";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

export type ExportFormat = "csv" | "csv-detail" | "xlsx";

interface ReportExportMenuProps {
  getExportUrl: (format: ExportFormat) => string;
  /** Called when user picks Print — opens browser print dialog. */
  onPrint?: () => void;
  disabled?: boolean;
}

export function ReportExportMenu({ getExportUrl, onPrint, disabled }: ReportExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <Download className="h-4 w-4" />
          Xuất file
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-bold tracking-widest uppercase">
          Định dạng
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={getExportUrl("csv")} download className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            CSV — tổng quan
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={getExportUrl("csv-detail")} download className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            CSV — chi tiết giao dịch
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={getExportUrl("xlsx")} download className="cursor-pointer">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel (.xlsx)
          </a>
        </DropdownMenuItem>
        {onPrint && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPrint} className="cursor-pointer">
              <Printer className="mr-2 h-4 w-4" />
              In báo cáo
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
