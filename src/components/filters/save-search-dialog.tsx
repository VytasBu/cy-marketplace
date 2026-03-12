"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import { useSavedSearches } from "@/lib/hooks/use-saved-searches";

export function SaveSearchDialog() {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { filters } = useFilters();
  const { saveSearch } = useSavedSearches();

  // Check if any filters are active
  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.location ||
    (filters.datePosted && filters.datePosted !== "all") ||
    (filters.sort && filters.sort !== "newest");

  if (!hasActiveFilters) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const result = await saveSearch(name.trim(), filters);
    setSaving(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setName("");
      setOpen(false);
    }
  };

  // Build a summary of active filters
  const filterSummary: string[] = [];
  if (filters.search) filterSummary.push(`"${filters.search}"`);
  if (filters.category) filterSummary.push(filters.category);
  if (filters.priceMin || filters.priceMax) {
    const range = [
      filters.priceMin ? `from ${filters.priceMin}` : "",
      filters.priceMax ? `to ${filters.priceMax}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    filterSummary.push(range);
  }
  if (filters.location) filterSummary.push(filters.location);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setName("");
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="w-full gap-1.5" />}
      >
        <Bookmark className="size-3.5" />
        Save this search
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Search</DialogTitle>
          <DialogDescription>
            Save your current filters so you can quickly load them later.
            {filterSummary.length > 0 && (
              <span className="block mt-1 text-xs">
                Active filters: {filterSummary.join(", ")}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <Input
            placeholder="Name your search (e.g. 'Bikes under 500')"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
          <DialogFooter className="mt-3">
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
