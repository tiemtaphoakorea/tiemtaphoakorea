import ExcelJS from "exceljs";

export type XlsxSheet = {
  name: string;
  /** First row used as header. Order preserved. */
  rows: object[];
  /** Optional column widths (in chars) — same order as keys of first row. */
  columnWidths?: number[];
  /** Columns that should be formatted as VND currency (by key). */
  currencyColumns?: string[];
};

/**
 * Build an .xlsx workbook with one sheet per `sheets` entry and stream as a
 * downloadable Response. exceljs is server-only — never import this from a
 * client component.
 */
export async function xlsxResponse(sheets: XlsxSheet[], filename: string): Promise<Response> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Admin Shop";
  wb.created = new Date();

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name.substring(0, 31)); // Excel sheet name limit
    if (sheet.rows.length === 0) {
      ws.addRow(["(Không có dữ liệu)"]);
      continue;
    }

    const headers = Object.keys(sheet.rows[0] as Record<string, unknown>);
    ws.columns = headers.map((h, i) => ({
      header: h,
      key: h,
      width: sheet.columnWidths?.[i] ?? Math.max(12, h.length + 4),
    }));

    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };

    for (const r of sheet.rows) {
      ws.addRow(r as Record<string, unknown>);
    }

    // Currency formatting
    if (sheet.currencyColumns?.length) {
      for (const colKey of sheet.currencyColumns) {
        const col = ws.getColumn(colKey);
        col.numFmt = '#,##0" ₫"';
        col.alignment = { horizontal: "right" };
      }
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
