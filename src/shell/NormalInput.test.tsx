import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NormalInput } from "./SliceControls";

describe("NormalInput", () => {
  it("does not commit 0 while a negative number is being typed", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<NormalInput label="x" value={1} onCommit={onCommit} />);
    const input = screen.getByLabelText("Normal x");

    // Act
    await user.clear(input);
    await user.type(input, "-2");

    // Assert
    expect(onCommit).not.toHaveBeenCalledWith(0);
    expect(onCommit).toHaveBeenLastCalledWith(-2);
  });

  it("reverts an emptied field to the current value on blur", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<NormalInput label="y" value={0.5} onCommit={onCommit} />);
    const input = screen.getByLabelText("Normal y");

    // Act
    await user.clear(input);
    await user.tab();

    // Assert
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue(0.5);
  });
});
