"use client";

import { Globe } from "lucide-react";

export function LanguageToggle() {
  // Language toggle is handled per-listing in the detail panel
  // This is a placeholder for potential global language preference
  return (
    <div>
      <h3 className="font-medium text-sm mb-2">Language</h3>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5" />
        Descriptions auto-translated to English. Toggle per listing in detail
        view.
      </p>
    </div>
  );
}
