import { Suspense } from "react";
import { MarketplaceLayout } from "@/components/layout/marketplace-layout";
import { Header } from "@/components/layout/header";

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
