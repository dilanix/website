import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { costGuide } from "@/lib/guides/definitions/cost";
import { integrationsGuide } from "@/lib/guides/definitions/integrations";
import { GUIDES } from "@/lib/guides/registry";
import { GuideLibrary } from "./guide-library";

afterEach(cleanup);

const player = () => screen.getByRole("group");
const pick = (title: string) =>
  within(screen.getByRole("navigation")).getByRole("button", {
    name: new RegExp(title),
  });

describe("GuideLibrary", () => {
  it("lists every guide and opens on the first setup guide, paused", () => {
    render(<GuideLibrary />);
    for (const guide of GUIDES) expect(pick(guide.title)).toBeTruthy();
    expect(player().getAttribute("aria-label")).toBe(integrationsGuide.title);
    expect(
      screen.getByRole("button", { name: `Play ${integrationsGuide.title}` }),
    ).toBeTruthy();
  });

  it("plays a picked guide at once", () => {
    render(<GuideLibrary />);
    fireEvent.click(pick(costGuide.title));
    expect(player().getAttribute("aria-label")).toBe(costGuide.title);
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
  });
});
