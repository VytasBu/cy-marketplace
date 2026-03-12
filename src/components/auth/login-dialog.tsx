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
import { useAuth } from "@/lib/context/auth-context";
import { LogIn, Mail, CheckCircle2 } from "lucide-react";

export function LoginDialog() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { signInWithOtp } = useAuth();

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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when closing
      setEmail("");
      setError(null);
      setSent(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <LogIn className="size-4" />
        Sign In
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to CY Marketplace</DialogTitle>
          <DialogDescription>
            Enter your Gmail address and we&apos;ll send you a magic link to
            sign in. No password needed.
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
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={submitting || !email}>
              {submitting ? "Sending..." : "Send magic link"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
