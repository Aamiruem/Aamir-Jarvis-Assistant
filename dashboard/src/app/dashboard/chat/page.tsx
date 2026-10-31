import type { Metadata } from "next";

import { ChatView } from "@/components/dashboard/chat-view";

export const metadata: Metadata = { title: "Chat" };

export default function ChatPage() {
  return <ChatView />;
}
