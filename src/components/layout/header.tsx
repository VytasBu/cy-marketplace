"use client";

import { useAuth } from "@/lib/context/auth-context";
import { LoginDialog } from "@/components/auth/login-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="h-14 border-b flex items-center px-4 shrink-0">
      <div className="flex items-center gap-2">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">CY</span>
          <span className="text-xl font-light text-muted-foreground">
            Marketplace
          </span>
        </a>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeSwitcher />
        {!loading && (user ? <UserMenu /> : <LoginDialog />)}
      </div>
    </header>
  );
}
