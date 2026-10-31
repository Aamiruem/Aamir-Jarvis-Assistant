"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { PageHeader } from "@/components/dashboard/page-header";
import { FormError, FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api-client";
import { cn, formatDateTime } from "@/lib/utils";
import { taskSchema, type TaskValues } from "@/lib/validation";
import { useAppDispatch, useAppSelector } from "@/store";
import { addTask, deleteTask, fetchTasks, selectVisibleTasks, setFilter, toggleTask, type TaskFilter } from "@/store/tasks-slice";

const FILTERS: TaskFilter[] = ["open", "done", "all"];

function NewTaskForm() {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<TaskValues>({
    resolver: yupResolver(taskSchema),
    defaultValues: { title: "", due: "", remindAt: "" },
  });

  const onSubmit = handleSubmit(async ({ title, due, remindAt }) => {
    setError(null);
    try {
      // <input type="datetime-local"> gives local time without a zone; the API wants ISO-8601.
      await dispatch(addTask({ title, due: due || null, remindAt: remindAt ? new Date(remindAt).toISOString() : null })).unwrap();
      reset();
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <Card className="py-5">
      <CardContent>
        <form onSubmit={onSubmit} className="grid items-start gap-4 md:grid-cols-[2fr_1fr_1fr_auto]" noValidate>
          <FormField label="Task" placeholder="Pay the electricity bill" registration={register("title")} error={formState.errors.title} />
          <FormField label="Due (optional)" placeholder="Friday" registration={register("due")} error={formState.errors.due} />
          <FormField label="Remind me at" type="datetime-local" registration={register("remindAt")} error={formState.errors.remindAt} />
          <Button type="submit" className="md:mt-[1.375rem]" disabled={formState.isSubmitting}>
            <Plus /> Add
          </Button>
        </form>
        <div className="mt-3">
          <FormError message={error} />
        </div>
      </CardContent>
    </Card>
  );
}

export function TasksView() {
  const dispatch = useAppDispatch();
  const { status, error, filter, items } = useAppSelector((s) => s.tasks);
  const visible = useAppSelector(selectVisibleTasks);

  useEffect(() => {
    if (status === "idle") dispatch(fetchTasks());
  }, [status, dispatch]);

  const openCount = items.filter((t) => !t.done).length;

  return (
    <>
      <PageHeader title="Tasks" description={`${openCount} open · stored in Redux Toolkit, validated with Yup`}>
        <div role="group" aria-label="Filter tasks" className="flex rounded-md border p-0.5">
          {FILTERS.map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "secondary" : "ghost"} aria-pressed={filter === f} onClick={() => dispatch(setFilter(f))}>
              {f[0].toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-4">
        <NewTaskForm />
        <FormError message={error} />

        {status === "loading" ? (
          <div className="grid gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">{filter === "done" ? "Nothing finished yet." : "No tasks. Enjoy the free time."}</p>
        ) : (
          <ul className="grid gap-2">
            <AnimatePresence initial={false}>
              {visible.map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={(e) => dispatch(toggleTask({ id: t.id, done: e.target.checked }))}
                      className="size-4 accent-[var(--primary)]"
                      aria-label={`Mark "${t.title}" as ${t.done ? "not done" : "done"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", t.done && "text-muted-foreground line-through")}>{t.title}</p>
                      <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        {t.due && <span>Due {t.due}</span>}
                        {t.remind_at && (
                          <span className="inline-flex items-center gap-1">
                            <Bell className="size-3" aria-hidden="true" /> {formatDateTime(t.remind_at)}
                          </span>
                        )}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => dispatch(deleteTask(t.id))} aria-label={`Delete "${t.title}"`}>
                      <Trash2 />
                    </Button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </>
  );
}
