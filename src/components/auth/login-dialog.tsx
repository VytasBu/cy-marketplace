"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/context/auth-context";
import { LogIn, Mail, CheckCircle2 } from "lucide-react";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginDialog() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signInWithOtp, signInWithGoogle, showLoginDialog, setShowLoginDialog } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.endsWith("@gmail.com")) {
      setError("Only Gmail addresses are supported for now.");
      return;
    }

    setSubmitting(true);
    const { error: authError } = await signInWithOtp(email);
    setSubmitting(false);

    if (authError) {
      setError(authError);
    } else {
      setSent(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error: authError } = await signInWithGoogle();
    if (authError) {
      setError(authError);
    }
    // OAuth redirects the page, so no need to handle success here
  };

  const handleOpenChange = (isOpen: boolean) => {
    setShowLoginDialog(isOpen);
    if (!isOpen) {
      setEmail("");
      setError(null);
      setSent(false);
    }
  };

  return (
    <Dialog open={showLoginDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="rounded-xl" />}
        onClick={() => setShowLoginDialog(true)}
      >
        <LogIn className="size-4" />
        Sign In
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to CY Marketplace</DialogTitle>
          <DialogDescription>
            Sign in with your Google account or receive a magic link via email.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="size-10 text-green-500" />
            <p className="text-center text-sm text-muted-foreground">
              Check your email for a magic link to sign in. It may take a minute
              to arrive.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Google OAuth button */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
            >
              <GoogleIcon className="size-5" />
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            {/* Magic link form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <Button type="submit" variant="secondary" disabled={submitting || !email}>
                {submitting ? "Sending..." : "Send magic link"}
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
