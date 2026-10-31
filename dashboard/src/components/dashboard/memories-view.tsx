"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { PageHeader } from "@/components/dashboard/page-header";
import { FormError } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { memorySchema, type MemoryValues } from "@/lib/validation";
import { filterMemories, useMemories } from "@/store/memories-store";

export function MemoriesView() {
  // Each selector subscribes to one slice of the Zustand store, so typing in the search box
  // re-renders only what reads `query`.
  const memories = useMemories((s) => s.memories);
  const loading = useMemories((s) => s.loading);
  const storeError = useMemories((s) => s.error);
  const query = useMemories((s) => s.query);
  const { setQuery, load, add, remove } = useMemories.getState();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<MemoryValues>({ resolver: zodResolver(memorySchema) });

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = handleSubmit(async ({ fact }) => {
    setError(null);
    try {
      await add(fact);
      reset();
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  const shown = filterMemories(memories, query);

  return (
    <>
      <PageHeader title="Memories" description="Facts Jarvis remembers about you · stored in Zustand" />

      <form onSubmit={onSubmit} className="mb-2 flex gap-2" noValidate>
        <label htmlFor="new-memory" className="sr-only">
          New memory
        </label>
        <Input id="new-memory" placeholder="I prefer tea over coffee" aria-invalid={Boolean(formState.errors.fact)} {...register("fact")} />
        <Button type="submit" disabled={formState.isSubmitting}>
          <Plus /> Remember
        </Button>
      </form>
      {formState.errors.fact && (
        <p role="alert" className="mb-2 text-sm text-destructive">
          {formState.errors.fact.message}
        </p>
      )}
      <FormError message={error ?? storeError} />

      <div className="relative my-4 max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search memories" aria-label="Search memories" className="pl-9" />
      </div>

      {loading && memories.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">{query ? "No memories match that search." : "Jarvis doesn't remember anything about you yet."}</p>
      ) : (
        <motion.ul layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {shown.map((m) => (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative rounded-xl border bg-card p-4"
              >
                <Brain className="mb-2 size-4 text-primary" aria-hidden="true" />
                <p className="pr-6 text-sm">{m.fact}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(m.created_at)}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 size-7 opacity-60 group-hover:opacity-100"
                  onClick={() => remove(m.id)}
                  aria-label={`Forget "${m.fact}"`}
                >
                  <X />
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </>
  );
}
