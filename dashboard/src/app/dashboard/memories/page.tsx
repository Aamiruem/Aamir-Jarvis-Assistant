import type { Metadata } from "next";

import { MemoriesView } from "@/components/dashboard/memories-view";

export const metadata: Metadata = { title: "Memories" };

export default function MemoriesPage() {
  return <MemoriesView />;
}
