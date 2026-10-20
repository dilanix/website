import { integrationsGuide } from "./definitions/integrations";
import { syncGuide } from "./definitions/sync";
import type { GuideDefinition } from "./types";

/** Every guide. Add a guide here and its scenes' visuals to `GUIDE_VISUALS`. */
export const GUIDES: readonly GuideDefinition[] = [
  integrationsGuide,
  syncGuide,
];

export function findGuide(key: string) {
  return GUIDES.find((guide) => guide.key === key);
}

/** The whole guide's running time, for Help & Support. */
export function guideDurationLabel(guide: GuideDefinition) {
  const totalMs = guide.scenes.reduce(
    (sum, scene) => sum + scene.durationMs,
    0,
  );
  return `${Math.max(1, Math.round(totalMs / 60_000))} min`;
}
