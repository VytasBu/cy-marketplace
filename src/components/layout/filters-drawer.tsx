"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FiltersSidebar } from "./filters-sidebar";

interface FiltersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FiltersDrawer({ open, onOpenChange }: FiltersDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-2 pb-6">
          <FiltersSidebar />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
