"use client";

import { useAuth } from "@/lib/context/auth-context";
import { LoginDialog } from "@/components/auth/login-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SearchInput } from "@/components/filters/search-input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { useFilters } from "@/lib/hooks/use-filters";
import { useCallback, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const CYPRUS_CITIES = [
  "Limassol",
  "Nicosia",
  "Paphos",
  "Larnaca",
  "Ayia Napa",
  "Famagusta",
  "Protaras",
  "Kyrenia",
];

interface HeaderProps {
  variant?: "homepage" | "search";
}

export function Header({ variant = "homepage" }: HeaderProps) {
  const { user, loading } = useAuth();
  const { filters, setFilter, setFilters } = useFilters();
  const [locationOpen, setLocationOpen] = useState(false);

  const handleSearch = useCallback(() => {
    if (filters.search) {
      setFilters({ search: filters.search, category: undefined });
    }
  }, [filters.search, setFilters]);

  const handleLocationSelect = useCallback(
    (city: string | undefined) => {
      setFilter("location", city);
      setLocationOpen(false);
    },
    [setFilter]
  );

  return (
    <header className={cn("shrink-0 px-8 pt-2", variant === "homepage" ? "pb-7" : "pb-2")}>
      {variant === "homepage" ? (
        <>
          {/* Top row: Logo + Auth */}
          <div className="flex items-center mb-4">
            <a href="/" className="flex items-center">
              <span className="text-sm font-medium text-foreground">
                CY-Marketplace
              </span>
            </a>
            <div className="ml-auto flex items-center gap-2">
              <ThemeSwitcher />
              {!loading && (user ? <UserMenu /> : <LoginDialog />)}
            </div>
          </div>

          {/* Homepage: prominent search bar — 3 separate elements */}
          <div className="flex items-center justify-center gap-2.5 max-w-[800px] mx-auto">
            {/* Search input */}
            <div className="flex-1 min-w-0">
              <SearchInput
                placeholder="What are you looking for?"
                variant="homepage"
              />
            </div>

            {/* Location selector */}
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-4 h-11 text-sm text-foreground whitespace-nowrap hover:bg-accent/50 transition-colors cursor-pointer shrink-0">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{filters.location || "All cyprus"}</span>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-1">
                <button
                  onClick={() => handleLocationSelect(undefined)}
                  className={cn(
                    "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent flex items-center justify-between",
                    !filters.location && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  All cyprus
                  {!filters.location && <Check className="h-3.5 w-3.5" />}
                </button>
                {CYPRUS_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleLocationSelect(city)}
                    className={cn(
                      "w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-accent flex items-center justify-between",
                      filters.location === city && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {city}
                    {filters.location === city && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Search button */}
            <Button
              onClick={handleSearch}
              className="gap-2 h-11 rounded-2xl px-5"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </>
      ) : (
        /* Search results: compact header with search in top row */
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center shrink-0">
            <span className="text-sm font-medium text-foreground">
              CY-Marketplace
            </span>
          </a>
          <div className="flex-1 max-w-[600px] mx-auto">
            <SearchInput />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeSwitcher />
            {!loading && (user ? <UserMenu /> : <LoginDialog />)}
          </div>
        </div>
      )}
    </header>
  );
}
