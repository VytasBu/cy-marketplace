import { Suspense } from "react";
import { MarketplaceLayout } from "@/components/layout/marketplace-layout";

function Header() {
  return (
    <header className="h-14 border-b flex items-center px-4 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">CY</span>
        <span className="text-xl font-light text-muted-foreground">
          Marketplace
        </span>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <Suspense>
        <MarketplaceLayout />
      </Suspense>
    </div>
  );
}
