"use client";

import { useState } from "react";
import { Provider } from "react-redux";

import { makeStore } from "@/store";

/**
 * One Redux store per browser tab, created on first render.
 * configureStore uses Math.random() internally, so with Cache Components this provider must
 * sit inside <Suspense>: it then renders per request instead of being baked into static HTML.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  return <Provider store={store}>{children}</Provider>;
}
