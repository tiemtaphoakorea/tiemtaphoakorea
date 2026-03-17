/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NumberInput } from "@/components/ui/number-input";

describe("NumberInput Component", () => {
  it("renders with initial value", () => {
    render(<NumberInput value={42} onValueChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("42");
  });

  it("accepts numeric input", async () => {
    render(<NumberInput />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "123");
    expect(input).toHaveValue("123");
  });

  it("rejects negative values by default", async () => {
    render(<NumberInput />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "-5");
    // allowNegative defaults to false, so "-" should not appear
    expect(input).not.toHaveValue("-5");
  });

  it("allows negative values when allowNegative is true", async () => {
    render(<NumberInput allowNegative={true} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "-5");
    expect(input).toHaveValue("-5");
  });

  it("applies custom className", () => {
    render(<NumberInput className="my-number-input" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("my-number-input");
  });

  it("disabled state blocks interactions", () => {
    render(<NumberInput disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("renders with placeholder", () => {
    render(<NumberInput placeholder="Enter number" />);
    expect(screen.getByPlaceholderText("Enter number")).toBeInTheDocument();
  });
});
