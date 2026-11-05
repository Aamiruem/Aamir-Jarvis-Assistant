"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send, Square, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { JarvisOrb } from "@/components/jarvis-orb";
import { FormError } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/api-client";
import { streamChat } from "@/lib/sse";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  tools: string[];
}

let nextId = 1;

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationId = useRef<string | undefined>(undefined);
  const abort = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Leaving the page (or the Activity boundary hiding it) stops an answer in progress.
  useEffect(() => () => abort.current?.abort(), []);

  const updateLast = (fn: (m: Message) => Message) => setMessages((all) => [...all.slice(0, -1), fn(all[all.length - 1])]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setError(null);
    setStreaming(true);
    setMessages((all) => [
      ...all,
      { id: nextId++, role: "user", text, tools: [] },
      { id: nextId++, role: "assistant", text: "", tools: [] },
    ]);
    abort.current = new AbortController();
    try {
      await streamChat(
        text,
        conversationId.current,
        (event) => {
          if (event.type === "conversation") conversationId.current = event.id;
          else if (event.type === "text") updateLast((m) => ({ ...m, text: m.text + event.text }));
          else if (event.type === "tool") updateLast((m) => ({ ...m, tools: [...m.tools, event.name] }));
          else if (event.type === "error") setError(event.message);
        },
        abort.current.signal,
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError(errorMessage(err));
    } finally {
      setStreaming(false);
      abort.current = null;
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-9rem)] max-w-3xl flex-col">
      <div className="flex-1 overflow-y-auto pr-1" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <JarvisOrb className="[--orb-size:8rem]" />
            <p className="text-muted-foreground">Ask Azarvis anything: &ldquo;Remind me to call Mom at 6pm&rdquo; or &ldquo;What&apos;s the weather in Pune?&rdquo;</p>
          </div>
        ) : (
          <ul className="grid gap-4 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "border bg-card",
                    )}
                  >
                    {m.tools.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {m.tools.map((t, i) => (
                          <Badge key={i} variant="secondary">
                            <Wrench /> {t.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {m.text || (streaming && m.role === "assistant" ? <span className="animate-pulse">Thinking…</span> : null)}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        <div ref={bottom} />
      </div>

      <FormError message={error} />
      <form onSubmit={send} className="mt-3 flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Message Azarvis
        </label>
        <Input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Azarvis…"
          autoComplete="off"
          className="h-11"
        />
        {streaming ? (
          <Button type="button" size="lg" variant="outline" onClick={() => abort.current?.abort()} aria-label="Stop">
            <Square />
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={!input.trim()} aria-label="Send">
            <Send />
          </Button>
        )}
      </form>
    </div>
  );
}
