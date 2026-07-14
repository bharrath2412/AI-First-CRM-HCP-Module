"use client";

import { useState, useEffect } from "react";
import type { InteractionFormState, ChatMessage } from "@/lib/types";
import { emptyFormState } from "@/lib/types";
import InteractionForm from "@/components/InteractionForm";
import ChatPanel from "@/components/ChatPanel";

export default function HomePage() {
  const [formState, setFormState] = useState<InteractionFormState>(emptyFormState);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());
  const [seeded, setSeeded] = useState(false);

  // Seed the database on first load
  useEffect(() => {
    if (!seeded) {
      fetch("/api/seed", { method: "POST" }).then(() => setSeeded(true)).catch(() => setSeeded(true));
    }
  }, [seeded]);

  // Add welcome message
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([
        {
          id: "welcome",
          role: "assistant",
          content:
            "👋 Welcome to the HCP Interaction Logger!\n\nI'm your AI assistant. Describe your interaction with a Healthcare Professional, and I'll automatically fill out the form for you.\n\n**Try saying something like:**\n- *\"Today I met with Dr. Smith and discussed product X efficiency. The sentiment was positive, and I shared the brochures.\"*\n- *\"Had a phone call with Dr. Johnson yesterday about GlucoBalance.\"*\n\nYou can also edit fields by saying things like:\n- *\"Change the name to Dr. Williams\"*\n- *\"The sentiment was actually negative\"*",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [chatHistory.length]);

  const handleSendMessage = async (message: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          chatHistory: chatHistory.filter((m) => m.id !== "welcome"),
          formState,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setChatHistory((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `⚠️ ${data.error}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        // Build system tool message if tools were used
        if (data.toolsUsed && data.toolsUsed.length > 0) {
          const toolMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "system",
            content: `🔧 Tools used: ${data.toolsUsed.join(", ")}`,
            timestamp: new Date().toISOString(),
          };
          setChatHistory((prev) => [...prev, toolMsg]);
        }

        // Add assistant response
        setChatHistory((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: data.message,
            timestamp: new Date().toISOString(),
          },
        ]);

        // Update form state
        if (data.formUpdates) {
          setFormState((prev) => {
            const updates = data.formUpdates as Partial<InteractionFormState>;
            const newState = { ...prev };
            for (const [key, value] of Object.entries(updates)) {
              if (value !== undefined && value !== null) {
                (newState as Record<string, string>)[key] = value as string;
              }
            }
            return newState;
          });

          // Highlight updated fields
          const updatedKeys = new Set(Object.keys(data.formUpdates));
          setHighlightedFields(updatedKeys);
          setTimeout(() => setHighlightedFields(new Set()), 2000);
        }
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ Sorry, something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormState(emptyFormState);
    setChatHistory([
      {
        id: "reset",
        role: "assistant",
        content: "🔄 Form has been cleared. Ready to log a new interaction! Describe your HCP interaction and I'll fill out the form.",
        timestamp: new Date().toISOString(),
      },
    ]);
    setHighlightedFields(new Set());
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">HCP Interaction Logger</h1>
            <p className="text-xs text-slate-500">AI-Powered Interaction Documentation</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          New Interaction
        </button>
      </header>

      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Form */}
        <div className="w-1/2 border-r border-slate-200 overflow-y-auto bg-white">
          <InteractionForm formState={formState} highlightedFields={highlightedFields} />
        </div>

        {/* Right Panel - Chat */}
        <div className="w-1/2 flex flex-col bg-slate-50">
          <ChatPanel
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
