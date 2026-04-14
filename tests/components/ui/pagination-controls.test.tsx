/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PaginationControls } from "@/components/ui/pagination-controls";

describe("PaginationControls Component", () => {
  it("renders current page indicator", () => {
    render(<PaginationControls currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
    const currentPageButton = screen.getByRole("button", { name: "Page 2" });
    expect(currentPageButton).toBeInTheDocument();
    expect(currentPageButton).toHaveAttribute("aria-current", "page");
  });

  it("previous button is disabled on first page", () => {
    render(<PaginationControls currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    const prevButton = screen.getByRole("button", { name: /previous page/i });
    expect(prevButton).toBeDisabled();
  });

  it("next button is disabled on last page", () => {
    render(<PaginationControls currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    const nextButton = screen.getByRole("button", { name: /next page/i });
    expect(nextButton).toBeDisabled();
  });

  it("clicking next fires correct callback", async () => {
    const onPageChange = vi.fn();
    render(<PaginationControls currentPage={2} totalPages={5} onPageChange={onPageChange} />);
    const nextButton = screen.getByRole("button", { name: "Next page" });
    await userEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("clicking previous fires correct callback", async () => {
    const onPageChange = vi.fn();
    render(<PaginationControls currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    const prevButton = screen.getByRole("button", { name: "Previous page" });
    await userEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("still renders navigation when totalPages is 1", () => {
    const { container } = render(
      <PaginationControls currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.querySelector("nav")).toBeInTheDocument();
  });

  it("shows correct total page count", () => {
    render(<PaginationControls currentPage={1} totalPages={10} onPageChange={vi.fn()} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});
