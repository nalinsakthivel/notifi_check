"use client";

import { useEffect } from "react";

export function DevtoolsGuard() {
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();

    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const blocked =
        key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(key)) ||
        (e.metaKey && e.altKey && ["I", "J", "C"].includes(key)) ||
        (e.ctrlKey && key === "U") ||
        (e.metaKey && key === "U");

      if (blocked) e.preventDefault();
    };

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  return null;
}
