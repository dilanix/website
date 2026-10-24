"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { updateAnomalyNotificationSettingsAction } from "@/app/dashboard/products/cost-actions";
import type {
  AnomalySeverity,
  CoreAnomalyNotificationSettings,
  CoreNotificationChannel,
  CoreNotificationDestination,
} from "@/lib/core/api";
import { ModalOverlay } from "@/components/dashboard/modal-overlay";
import { NotificationDestinationPicker } from "./notification-destination-picker";

const SEVERITY_OPTIONS: {
  value: AnomalySeverity;
  label: string;
  hint: string;
}[] = [
  { value: "low", label: "Every anomaly", hint: "50% or more above average" },
  { value: "medium", label: "Medium and high", hint: "at least double" },
  { value: "high", label: "High only", hint: "300% or more above average" },
];

export function AnomalyNotificationSettingsDialog({
  settings,
  channels,
  destinations,
  onClose,
  onSaved,
}: {
  settings: CoreAnomalyNotificationSettings;
  channels: CoreNotificationChannel[];
  destinations: CoreNotificationDestination[];
  onClose: () => void;
  onSaved: (settings: CoreAnomalyNotificationSettings) => void;
}) {
  const [minSeverity, setMinSeverity] = useState(settings.min_severity);
  const [destinationIds, setDestinationIds] = useState(
    settings.destination_ids,
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    setError("");
    startTransition(async () => {
      const result = await updateAnomalyNotificationSettingsAction({
        min_severity: minSeverity,
        destination_ids: destinationIds,
      });
      if (result.error) return setError(result.error);
      if (result.data) onSaved(result.data);
    });
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="anomaly-notifications-title"
        className="bg-background border-foreground/15 my-8 w-full max-w-xl rounded-xl border p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="anomaly-notifications-title"
              className="text-lg font-semibold"
            >
              Anomaly notifications
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Where a newly detected anomaly is sent, with the services that
              grew the most and a link to its details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted-foreground p-1"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <fieldset className="text-sm">
            <legend className="mb-1.5 font-medium">Notify about</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {SEVERITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="border-foreground/15 has-[:checked]:border-accent flex cursor-pointer flex-col rounded-lg border px-3 py-2.5"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="min-severity"
                      value={option.value}
                      checked={minSeverity === option.value}
                      onChange={() => setMinSeverity(option.value)}
                    />
                    {option.label}
                  </span>
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    {option.hint}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="text-sm">
            <legend className="mb-1.5 font-medium">
              Notification destinations
            </legend>
            <NotificationDestinationPicker
              channels={channels}
              destinations={destinations}
              selectedIds={destinationIds}
              onChange={setDestinationIds}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              {destinationIds.length === 0
                ? "No destination selected — anomalies are recorded but nobody is notified."
                : `${destinationIds.length} destination${destinationIds.length === 1 ? "" : "s"} selected.`}
            </p>
          </fieldset>

          {error ? (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          ) : null}

          <button
            disabled={pending}
            className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </ModalOverlay>
  );
}
