/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
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

  it("does not emit values above max after clamping to max", async () => {
    const emittedValues: number[] = [];

    function ControlledNumberInput() {
      const [value, setValue] = useState("");

      return (
        <NumberInput
          value={value}
          max={20_000_000}
          onValueChange={(values) => {
            if (values.floatValue !== undefined) {
              emittedValues.push(values.floatValue);
            }
            setValue(values.value);
          }}
        />
      );
    }

    render(<ControlledNumberInput />);
    let input = screen.getByRole("textbox");

    await userEvent.type(input, "30000000");
    input = screen.getByRole("textbox");
    expect(input).toHaveValue("20.000.000");

    await userEvent.type(input, "0");
    input = screen.getByRole("textbox");
    expect(input).toHaveValue("20.000.000");
    expect(emittedValues).not.toContain(200_000_000);
  });

  it("keeps focus after clamping to max", async () => {
    function ControlledNumberInput() {
      const [value, setValue] = useState("");

      return (
        <NumberInput
          value={value}
          max={20_000_000}
          onValueChange={(values) => setValue(values.value)}
        />
      );
    }

    render(<ControlledNumberInput />);
    const input = screen.getByRole("textbox");

    await userEvent.type(input, "30000000");

    const currentInput = screen.getByRole("textbox");
    expect(currentInput).toHaveValue("20.000.000");
    expect(currentInput).toHaveFocus();
  });
});
