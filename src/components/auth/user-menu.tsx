"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";
import { Heart, Search, LogOut, ChevronDown } from "lucide-react";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  if (!user) return null;

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleNav = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5"
      >
        <span className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
          {initial}
        </span>
        <span className="hidden sm:inline text-sm">{displayName}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-background shadow-lg z-50 py-1">
          <button
            onClick={() => handleNav("/saved")}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Heart className="size-4" />
            Saved Listings
          </button>
          <button
            onClick={() => handleNav("/saved?tab=searches")}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Search className="size-4" />
            Saved Searches
          </button>
          <div className="border-t my-1" />
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push("/");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
