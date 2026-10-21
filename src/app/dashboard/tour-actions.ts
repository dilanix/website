"use server";

import { z } from "zod";
import { getAccessToken } from "@/lib/auth/session";
import { CoreApiError, saveTourProgress } from "@/lib/core/api";

// Mirrors Core's `modules.onboarding.schema` validation.
const segment = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const progressSchema = z.object({
  tourKey: z.string().max(100).regex(segment),
  tourVersion: z.number().int().min(1).max(1_000_000),
  status: z.enum(["in_progress", "completed", "dismissed"]),
  stepId: z.string().max(64).regex(segment).nullable(),
});

export type TourProgressInput = z.input<typeof progressSchema>;

/** Records the signed-in user's progress through one product tour. Failures
 *  are returned, never thrown — a tour must not break the page it runs on. */
export async function saveTourProgressAction(
  input: TourProgressInput,
): Promise<{ error?: string }> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid tour progress." };
  const token = await getAccessToken();
  if (!token) return { error: "Your session has expired." };
  try {
    await saveTourProgress(parsed.data.tourKey, token, {
      tour_version: parsed.data.tourVersion,
      status: parsed.data.status,
      step_id: parsed.data.stepId,
    });
    return {};
  } catch (error) {
    return {
      error:
        error instanceof CoreApiError
          ? error.message
          : "Unable to save tour progress.",
    };
  }
}
