"use client";

export default function OfflinePage() {
  return (
    <div className="flex items-center justify-center h-screen bg-[var(--canvas)]">
      <div className="text-center p-8 max-w-md">
        <div className="text-5xl mb-4">📡</div>
        <h1 className="text-2xl font-semibold mb-2">You&apos;re offline</h1>
        <p className="text-[var(--muted-foreground)]">
          Check your internet connection and try again. Previously viewed
          listings may still be available.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 rounded-lg bg-[var(--secondary)] text-white font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
