import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModalOverlay } from "./modal-overlay";

afterEach(cleanup);

describe("ModalOverlay", () => {
  it("portals above the page and closes only when the backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ModalOverlay onClose={onClose}>
        <div role="dialog" aria-label="Example dialog">
          <button type="button">Inside</button>
        </div>
      </ModalOverlay>,
    );

    const dialog = screen.getByRole("dialog", { name: "Example dialog" });
    expect(container).toBeEmptyDOMElement();

    fireEvent.click(screen.getByRole("button", { name: "Inside" }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(dialog.parentElement!);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
