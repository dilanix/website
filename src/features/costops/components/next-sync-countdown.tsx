"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

type NextSyncCountdownProps = {
  nextSyncAt: string | null;
};

function getCountdown(nextSyncAt: string | null) {
  if (!nextSyncAt) {
    return {
      label: "Not scheduled",
      status: "empty",
    };
  }

  const target = new Date(nextSyncAt).getTime();

  if (Number.isNaN(target)) {
    return {
      label: "Not scheduled",
      status: "empty",
    };
  }

  const diff = target - Date.now();

  if (diff <= 0) {
    return {
      label: "Sync due",
      status: "due",
    };
  }

  const totalMinutes = Math.ceil(diff / 60_000);

  if (totalMinutes < 60) {
    return {
      label: `Next sync in ${totalMinutes} min`,
      status: totalMinutes <= 15 ? "soon" : "scheduled",
    };
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (totalHours < 24) {
    return {
      label: `Next sync in ${totalHours}h ${minutes}m`,
      status: "scheduled",
    };
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return {
    label: `Next sync in ${days}d ${hours}h`,
    status: "scheduled",
  };
}

export function NextSyncCountdown({
  nextSyncAt,
}: NextSyncCountdownProps) {
  const [countdown, setCountdown] = useState(() =>
    getCountdown(nextSyncAt),
  );

  useEffect(() => {
    const update = () => {
      setCountdown(getCountdown(nextSyncAt));
    };

    update();

    const interval = window.setInterval(update, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [nextSyncAt]);

  const className =
    countdown.status === "due"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      : countdown.status === "soon"
        ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
        : countdown.status === "empty"
          ? "border-border bg-muted text-muted-foreground"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Clock3 className="h-3.5 w-3.5" />
      {countdown.label}
    </span>
  );
}