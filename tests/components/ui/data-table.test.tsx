/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/ui/data-table";

type RowData = {
  id: string;
  name: string;
  status: string;
};

const columns: ColumnDef<RowData>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <span>{row.original.status.toUpperCase()}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => <button type="button">Action</button>,
  },
];

describe("DataTable", () => {
  it("renders accessor and custom cell content", () => {
    render(
      <DataTable
        columns={columns}
        data={[{ id: "1", name: "Alpha", status: "active" }]}
        pagination={{ pageIndex: 0, pageSize: 10 }}
      />,
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("calls onRowClick for row clicks but ignores nested button clicks", async () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={[{ id: "1", name: "Alpha", status: "active" }]}
        pagination={{ pageIndex: 0, pageSize: 10 }}
        onRowClick={onRowClick}
      />,
    );

    await userEvent.click(screen.getByText("Alpha"));
    expect(onRowClick).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Action" }));
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it("forwards pagination changes", async () => {
    const onPaginationChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={[{ id: "1", name: "Alpha", status: "active" }]}
        pageCount={3}
        pagination={{ pageIndex: 0, pageSize: 10 }}
        onPaginationChange={onPaginationChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /go to next page/i }));
    expect(onPaginationChange).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 10 });
  });
});
