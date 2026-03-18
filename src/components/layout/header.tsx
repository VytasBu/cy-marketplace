"use client";

import { useAuth } from "@/lib/context/auth-context";
import { LoginDialog } from "@/components/auth/login-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SearchInput } from "@/components/filters/search-input";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  variant?: "homepage" | "search";
  hidden?: boolean;
}

function LogoRow({ loading, user }: { loading: boolean; user: unknown }) {
  return (
    <div className="flex items-center">
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
  );
}

export function Header({ variant = "homepage", hidden = false }: HeaderProps) {
  const { user, loading } = useAuth();
  const searchRef = useRef(null);

  const isHomepage = variant === "homepage";
  const isCompact = !isHomepage || hidden;

  if (isHomepage) {
    return (
      <header className={cn(
        "shrink-0 px-8 relative z-20",
        // On mobile: always expanded padding. On desktop: depends on compact state.
        "pt-2 pb-7 md:pt-0 md:pb-0",
        isCompact ? "md:pb-2" : "md:pt-2 md:pb-7",
      )}>
        {/* Mobile: always full layout — search full-width below logo */}
        <div className="flex flex-col md:hidden">
          <div className="mb-4">
            <LogoRow loading={loading} user={user} />
          </div>
          <div className="max-w-[560px] mx-auto w-full">
            <SearchInput ref={searchRef} placeholder="What are you looking for?" variant="homepage" />
          </div>
        </div>

        {/* Desktop: compact (inline) or expanded based on scroll */}
        {isCompact ? (
          <div className="hidden md:flex items-center gap-4 animate-in fade-in duration-150">
            <a href="/" className="flex items-center shrink-0">
              <span className="text-sm font-medium text-foreground">
                CY-Marketplace
              </span>
            </a>
            <div className="flex-1 max-w-[560px] mx-auto">
              <SearchInput ref={searchRef} placeholder="What are you looking for?" variant="homepage" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeSwitcher />
              {!loading && (user ? <UserMenu /> : <LoginDialog />)}
            </div>
          </div>
        ) : (
          <div className="hidden md:block">
            <div className="mb-4">
              <LogoRow loading={loading} user={user} />
            </div>
            <div className="max-w-[560px] mx-auto">
              <SearchInput ref={searchRef} placeholder="What are you looking for?" variant="homepage" />
            </div>
          </div>
        )}
      </header>
    );
  }

  // Search results variant
  return (
    <header className="shrink-0 px-8 pb-2 relative z-20">
      {/* Desktop: single row */}
      <div className="hidden md:flex items-center gap-4">
        <a href="/" className="flex items-center shrink-0">
          <span className="text-sm font-medium text-foreground">
            CY-Marketplace
          </span>
        </a>
        <div className="flex-1 max-w-[560px] mx-auto">
          <SearchInput ref={searchRef} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeSwitcher />
          {!loading && (user ? <UserMenu /> : <LoginDialog />)}
        </div>
      </div>
      {/* Mobile: search full-width below logo row */}
      <div className="flex flex-col gap-3 md:hidden">
        <LogoRow loading={loading} user={user} />
        <SearchInput ref={searchRef} />
      </div>
    </header>
  );
}
