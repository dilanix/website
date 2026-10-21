import { CoreApiError } from "@/lib/core/api";

const NO_AUTOMATIC_DATASETS = /no datasets? eligible for automatic sync/i;

/**
 * Core currently identifies this conflict only through its human-readable
 * `detail` string. Keep the match narrow so unrelated 409 responses retain
 * their original diagnostic message.
 */
export function automaticSyncErrorMessage(error: unknown): string | null {
  if (
    error instanceof CoreApiError &&
    error.status === 409 &&
    NO_AUTOMATIC_DATASETS.test(error.message)
  ) {
    return "Automatic sync could not find any eligible datasets. Enable product access and the required capabilities for this connection, or choose “Select manually” to run a specific enabled dataset.";
  }

  return null;
}
