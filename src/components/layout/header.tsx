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

export function Header({ variant = "homepage", hidden = false }: HeaderProps) {
  const { user, loading } = useAuth();
  const searchRef = useRef(null);

  const isHomepage = variant === "homepage";
  const isCompact = !isHomepage || hidden;

  if (isHomepage) {
    return (
      <header className={cn(
        "shrink-0 px-8 relative z-20",
        isCompact ? "pb-2" : "pt-2 pb-7",
      )}>
        {isCompact ? (
          <div className="flex items-center gap-4 animate-in fade-in duration-150">
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
          <>
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
            <div className="max-w-[560px] mx-auto">
              <SearchInput ref={searchRef} placeholder="What are you looking for?" variant="homepage" />
            </div>
          </>
        )}
      </header>
    );
  }

  return (
    <header className="shrink-0 px-8 pb-2 relative z-20">
      <div className="flex items-center gap-4">
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
    </header>
  );
}
