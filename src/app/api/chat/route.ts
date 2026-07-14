import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent/graph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import type { InteractionFormState, ChatMessage } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      chatHistory,
      formState,
    }: {
      message: string;
      chatHistory: ChatMessage[];
      formState: InteractionFormState;
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Convert chat history to LangChain messages
    const langchainHistory = (chatHistory || [])
      .filter((m: ChatMessage) => m.role === "user" || m.role === "assistant")
      .map((m: ChatMessage) => {
        if (m.role === "user") return new HumanMessage(m.content);
        return new AIMessage(m.content);
      });

    const result = await runAgent(message, langchainHistory, formState);

    return NextResponse.json({
      message: result.response,
      formUpdates: result.formUpdates,
      toolsUsed: result.toolsUsed,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process message. Please try again." },
      { status: 500 }
    );
  }
}
