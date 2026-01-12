"use client";

import { useEffect } from "react";

export function usePageTitle(unfulfilledCount: number) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (unfulfilledCount > 0) {
        document.title = `Fulfill (${unfulfilledCount}) - Daily Ops Planner`;
      } else {
        document.title = "Daily Ops Planner";
      }
    }
  }, [unfulfilledCount]);
}

