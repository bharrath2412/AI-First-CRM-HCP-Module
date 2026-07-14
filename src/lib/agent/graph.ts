import { StateGraph, START, END, Annotation, messagesStateReducer } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { allTools } from "./tools";
import type { InteractionFormState } from "../types";

// ─── State definition ───
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  formState: Annotation<InteractionFormState>({
    reducer: (_prev, next) => next,
    default: () => ({
      hcpName: "",
      interactionType: "Meeting",
      date: "",
      time: "",
      attendees: "",
      topicsDiscussed: "",
      materialsShared: "",
      sentiment: "" as const,
      outcomes: "",
      followUpActions: "",
    }),
  }),
});

const SYSTEM_PROMPT = `You are an AI assistant specialized in logging Healthcare Professional (HCP) interactions for pharmaceutical sales representatives. Your role is to help users efficiently log their HCP interactions through natural conversation.

IMPORTANT RULES:
1. When a user describes an interaction, use the Log_Interaction tool to extract ALL relevant fields and populate the form.
2. When a user wants to correct or update specific fields, use the Edit_Interaction tool to update ONLY the mentioned fields.
3. When an HCP name is mentioned, use Search_HCP_Database to validate it.
4. When materials or samples are mentioned, use Lookup_Product_Materials to verify them.
5. When follow-up actions are mentioned, use Schedule_FollowUp to record them.
6. When the user asks to save or submit, use Save_Interaction_To_DB.
7. If today's date is needed and the user says "today", use today's date: ${new Date().toISOString().split("T")[0]}.
8. Always be helpful and confirm what you've logged. If information is ambiguous, make reasonable inferences.
9. After logging, give a summary of what was captured and ask if anything needs correction.
10. For sentiment, infer from context clues: words like "great", "interested", "enthusiastic" = Positive; "okay", "fine" = Neutral; "concerned", "skeptical", "resistant" = Negative.

You can handle multiple operations in sequence. For example, when logging a new interaction, you might call Log_Interaction, Search_HCP_Database, and Lookup_Product_Materials all in the same turn.`;

function createModel() {
  const apiKey = process.env.GROQ_API_KEY;

  if (apiKey) {
    return new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      apiKey: apiKey,
    });
  }

  // Return null if no API key - we'll handle this with a fallback
  return null;
}

// ─── Fallback LLM logic when no OpenAI key ───
function fallbackParsing(userMessage: string, currentForm: InteractionFormState): {
  response: string;
  toolCalls: Array<{ name: string; args: Record<string, string> }>;
} {
  const msg = userMessage.toLowerCase();
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 5);

  // Check if this is an edit/correction request
  const isEdit =
    msg.includes("change") ||
    msg.includes("correct") ||
    msg.includes("update") ||
    msg.includes("actually") ||
    msg.includes("sorry") ||
    msg.includes("modify") ||
    msg.includes("fix") ||
    msg.includes("wrong") ||
    msg.includes("instead") ||
    msg.includes("replace");

  // Check if user wants to save
  if (msg.includes("save") || msg.includes("submit") || msg.includes("finalize") || msg.includes("confirm")) {
    if (currentForm.hcpName) {
      return {
        response: `Saving the interaction with ${currentForm.hcpName} to the database...`,
        toolCalls: [
          {
            name: "Save_Interaction_To_DB",
            args: {
              hcpName: currentForm.hcpName,
              interactionType: currentForm.interactionType,
              date: currentForm.date || today,
              time: currentForm.time,
              attendees: currentForm.attendees,
              topicsDiscussed: currentForm.topicsDiscussed,
              materialsShared: currentForm.materialsShared,
              sentiment: currentForm.sentiment,
              outcomes: currentForm.outcomes,
              followUpActions: currentForm.followUpActions,
            },
          },
        ],
      };
    }
    return {
      response: "There's no interaction data to save yet. Please describe an interaction first.",
      toolCalls: [],
    };
  }

  // Extract entities from the message
  const namePatterns = [
    /(?:dr\.?\s*|doctor\s+)([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i,
    /(?:with|met|saw|visited|called)\s+(?:dr\.?\s*)?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i,
    /(?:hcp|name)\s+(?:is|was|should be)\s+(?:dr\.?\s*)?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i,
  ];

  let extractedName = "";
  for (const pattern of namePatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      extractedName = "Dr. " + match[1].trim();
      break;
    }
  }

  // Extract sentiment
  let sentiment = "";
  if (/positive|great|enthusiastic|interested|excited|happy|pleased|receptive|supportive/i.test(msg)) {
    sentiment = "Positive";
  } else if (/negative|concerned|skeptical|resistant|unhappy|frustrated|disappointed|reluctant/i.test(msg)) {
    sentiment = "Negative";
  } else if (/neutral|okay|fine|indifferent|so-so|average/i.test(msg)) {
    sentiment = "Neutral";
  }

  // Extract interaction type
  let interactionType = "Meeting";
  if (/phone\s*call|called|spoke on the phone/i.test(msg)) interactionType = "Phone Call";
  else if (/email|emailed/i.test(msg)) interactionType = "Email";
  else if (/video\s*call|zoom|teams|virtual/i.test(msg)) interactionType = "Video Call";
  else if (/conference|congress|symposium/i.test(msg)) interactionType = "Conference";
  else if (/lunch|dinner|meal/i.test(msg)) interactionType = "Lunch Meeting";

  // Extract date
  let extractedDate = "";
  if (/today/i.test(msg)) extractedDate = today;
  else if (/yesterday/i.test(msg)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    extractedDate = d.toISOString().split("T")[0];
  } else {
    const dateMatch = msg.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) extractedDate = dateMatch[1];
    else extractedDate = today;
  }

  // Extract time
  let extractedTime = "";
  const timeMatch = msg.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    if (timeMatch[3]?.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (timeMatch[3]?.toLowerCase() === "am" && hours === 12) hours = 0;
    extractedTime = `${hours.toString().padStart(2, "0")}:${minutes}`;
  } else if (/morning/i.test(msg)) {
    extractedTime = "09:00";
  } else if (/afternoon/i.test(msg)) {
    extractedTime = "14:00";
  } else if (/evening/i.test(msg)) {
    extractedTime = "17:00";
  }

  // Extract materials
  const materialPatterns = [
    /(?:shared|distributed|gave|provided|left|handed)\s+(?:the\s+)?(.+?)(?:\.|,|$|and\s+(?:discussed|the sentiment))/i,
    /(?:brochures?|samples?|flyers?|leaflets?|materials?)(?:\s+(?:for|about|on)\s+(.+?))?(?:\.|,|$)/i,
  ];
  let extractedMaterials = "";
  for (const pattern of materialPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      extractedMaterials = match[0].replace(/^(shared|distributed|gave|provided|left|handed)\s+(the\s+)?/i, "").replace(/\.$/, "").trim();
      break;
    }
  }
  if (!extractedMaterials && /brochure|sample|flyer|leaflet|material|pamphlet/i.test(msg)) {
    const matMatch = msg.match(/((?:[\w]+\s+)?(?:brochures?|samples?|flyers?|leaflets?|materials?|pamphlets?)(?:\s+(?:for|about|on)\s+[\w\s]+)?)/i);
    if (matMatch) extractedMaterials = matMatch[1].trim();
  }

  // Extract topics
  const topicPatterns = [
    /(?:discussed|talked about|covered|presented|went over|reviewed)\s+(.+?)(?:\.|,|$|(?:the sentiment|and shared|and gave|and left|and distributed))/i,
    /(?:topic|subject|about)\s+(?:was|were|is)\s+(.+?)(?:\.|,|$)/i,
  ];
  let extractedTopics = "";
  for (const pattern of topicPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      extractedTopics = match[1].trim().replace(/\.$/, "");
      break;
    }
  }

  // Extract attendees
  let extractedAttendees = "";
  const attendeeMatch = userMessage.match(/(?:attendees?|participants?|also present|joined by|along with)\s+(?:were|was|included|:)?\s*(.+?)(?:\.|$)/i);
  if (attendeeMatch) {
    extractedAttendees = attendeeMatch[1].trim();
  }

  // Extract outcomes
  let extractedOutcomes = "";
  const outcomeMatch = userMessage.match(/(?:outcome|result|concluded|agreed|decided)\s+(?:was|were|is|that|to)?\s*(.+?)(?:\.|$)/i);
  if (outcomeMatch) {
    extractedOutcomes = outcomeMatch[1].trim();
  }

  // Extract follow-up
  let extractedFollowUp = "";
  const followUpMatch = userMessage.match(/(?:follow[- ]?up|next step|need to|plan to|will)\s+(?:is|was|are|:)?\s*(.+?)(?:\.|$)/i);
  if (followUpMatch) {
    extractedFollowUp = followUpMatch[1].trim();
  }

  if (isEdit && currentForm.hcpName) {
    // Edit mode: only update mentioned fields
    const editArgs: Record<string, string> = {};
    if (extractedName) editArgs.hcpName = extractedName;
    if (sentiment) editArgs.sentiment = sentiment;
    if (interactionType !== "Meeting" || /type.*(?:should|is|was)\s/i.test(msg)) editArgs.interactionType = interactionType;
    if (extractedTopics) editArgs.topicsDiscussed = extractedTopics;
    if (extractedMaterials) editArgs.materialsShared = extractedMaterials;
    if (extractedAttendees) editArgs.attendees = extractedAttendees;
    if (extractedOutcomes) editArgs.outcomes = extractedOutcomes;
    if (extractedFollowUp) editArgs.followUpActions = extractedFollowUp;

    // Handle direct field value corrections
    const directEdit = userMessage.match(/(?:name|hcp)\s+(?:should be|was actually|is actually|to)\s+(?:dr\.?\s*)?(.+?)(?:\.|,|$)/i);
    if (directEdit) editArgs.hcpName = "Dr. " + directEdit[1].trim();
    const dateEdit = userMessage.match(/(?:date)\s+(?:should be|was actually|is actually|to)\s+(.+?)(?:\.|,|$)/i);
    if (dateEdit) editArgs.date = dateEdit[1].trim();
    const timeEdit = userMessage.match(/(?:time)\s+(?:should be|was actually|is actually|to)\s+(.+?)(?:\.|,|$)/i);
    if (timeEdit) editArgs.time = timeEdit[1].trim();

    const toolCalls: Array<{ name: string; args: Record<string, string> }> = [];
    if (Object.keys(editArgs).length > 0) {
      toolCalls.push({ name: "Edit_Interaction", args: editArgs });
    }
    if (editArgs.hcpName) {
      toolCalls.push({ name: "Search_HCP_Database", args: { query: editArgs.hcpName.replace(/^Dr\.?\s*/i, "") } });
    }

    const changedFields = Object.keys(editArgs).join(", ");
    return {
      response: `I've updated the following fields: ${changedFields}. The rest of the form remains unchanged. Let me know if you need any other corrections.`,
      toolCalls,
    };
  }

  // New interaction logging
  if (extractedName || extractedTopics || sentiment) {
    const toolCalls: Array<{ name: string; args: Record<string, string> }> = [];

    toolCalls.push({
      name: "Log_Interaction",
      args: {
        hcpName: extractedName || currentForm.hcpName || "Unknown HCP",
        interactionType,
        date: extractedDate || today,
        time: extractedTime || now,
        attendees: extractedAttendees,
        topicsDiscussed: extractedTopics,
        materialsShared: extractedMaterials,
        sentiment,
        outcomes: extractedOutcomes,
        followUpActions: extractedFollowUp,
      },
    });

    if (extractedName) {
      toolCalls.push({
        name: "Search_HCP_Database",
        args: { query: extractedName.replace(/^Dr\.?\s*/i, "") },
      });
    }

    if (extractedMaterials) {
      toolCalls.push({
        name: "Lookup_Product_Materials",
        args: { query: extractedMaterials },
      });
    }

    if (extractedFollowUp) {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 7);
      toolCalls.push({
        name: "Schedule_FollowUp",
        args: {
          action: extractedFollowUp,
          dueDate: followUpDate.toISOString().split("T")[0],
        },
      });
    }

    const parts = [];
    parts.push(`✅ Interaction logged successfully! Here's what I captured:`);
    if (extractedName) parts.push(`• **HCP Name:** ${extractedName}`);
    parts.push(`• **Type:** ${interactionType}`);
    parts.push(`• **Date:** ${extractedDate || today}`);
    if (extractedTime) parts.push(`• **Time:** ${extractedTime}`);
    if (extractedAttendees) parts.push(`• **Attendees:** ${extractedAttendees}`);
    if (extractedTopics) parts.push(`• **Topics:** ${extractedTopics}`);
    if (extractedMaterials) parts.push(`• **Materials:** ${extractedMaterials}`);
    if (sentiment) parts.push(`• **Sentiment:** ${sentiment}`);
    if (extractedOutcomes) parts.push(`• **Outcomes:** ${extractedOutcomes}`);
    if (extractedFollowUp) parts.push(`• **Follow-up:** ${extractedFollowUp}`);
    parts.push(`\nPlease review the form on the left. Let me know if anything needs to be corrected!`);

    return { response: parts.join("\n"), toolCalls };
  }

  return {
    response:
      "I'd be happy to help you log an HCP interaction! Please describe your interaction, for example:\n\n*\"Today I met with Dr. Smith and discussed product X efficiency. The sentiment was positive, and I shared the brochures.\"*\n\nYou can also say things like:\n- \"Change the name to Dr. Johnson\"\n- \"Save the interaction\"\n- \"The sentiment was actually negative\"",
    toolCalls: [],
  };
}

// ─── Build the graph ───
export async function runAgent(
  userMessage: string,
  chatHistory: BaseMessage[],
  currentFormState: InteractionFormState
): Promise<{
  response: string;
  formUpdates: Partial<InteractionFormState> | null;
  toolsUsed: string[];
}> {
  const model = createModel();
  const toolsUsed: string[] = [];
  let formUpdates: Partial<InteractionFormState> = {};
  let responseText = "";

  let useFallback = !model;

  if (model) {
    try {
      // ──── Real LLM path ────
      const toolNode = new ToolNode(allTools);
      const modelWithTools = model.bindTools(allTools);

      const callModel = async (state: typeof AgentState.State) => {
        const systemMsg = new SystemMessage(SYSTEM_PROMPT + `\n\nCurrent form state: ${JSON.stringify(state.formState)}`);
        const result = await modelWithTools.invoke([systemMsg, ...state.messages]);
        return { messages: [result] };
      };

      const shouldContinue = (state: typeof AgentState.State): string => {
        const lastMsg = state.messages[state.messages.length - 1];
        if (lastMsg && "tool_calls" in lastMsg && (lastMsg as AIMessage).tool_calls?.length) {
          return "tools";
        }
        return END;
      };

      const graph = new StateGraph(AgentState)
        .addNode("agent", callModel)
        .addNode("tools", toolNode)
        .addEdge(START, "agent")
        .addConditionalEdges("agent", shouldContinue, { tools: "tools", [END]: END })
        .addEdge("tools", "agent")
        .compile();

      const result = await graph.invoke({
        messages: [...chatHistory, new HumanMessage(userMessage)],
        formState: currentFormState,
      });

      // Extract the response and tool results
      for (const msg of result.messages) {
        if (msg instanceof AIMessage && msg.tool_calls?.length) {
          for (const tc of msg.tool_calls) {
            toolsUsed.push(tc.name);
          }
        }
      }

      // Get form updates from tool call results
      for (const msg of result.messages) {
        if (msg && typeof msg === "object" && "content" in msg && "name" in msg) {
          try {
            const content = typeof msg.content === "string" ? JSON.parse(msg.content) : msg.content;
            if (content.updates) {
              formUpdates = { ...formUpdates, ...content.updates };
            }
          } catch {
            // skip
          }
        }
      }

      // Get the final text response
      const lastMsg = result.messages[result.messages.length - 1];
      responseText = typeof lastMsg.content === "string" ? lastMsg.content : JSON.stringify(lastMsg.content);
    } catch (error) {
      console.error("LLM execution failed (e.g. rate limit / quota), falling back to structured parsing:", error);
      useFallback = true;
    }
  }

  if (useFallback) {
    // ──── Fallback path: structured parsing ────
    const fallback = fallbackParsing(userMessage, currentFormState);
    responseText = fallback.response;

    for (const tc of fallback.toolCalls) {
      toolsUsed.push(tc.name);

      // Execute the actual tools
      const matchedTool = allTools.find((t) => t.name === tc.name);
      if (matchedTool) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (matchedTool as any).invoke(tc.args);
          const parsed = JSON.parse(typeof result === "string" ? result : JSON.stringify(result));
          if (parsed.updates) {
            formUpdates = { ...formUpdates, ...parsed.updates };
          }
        } catch {
          // Tool execution failed, continue
        }
      }
    }
  }

  return {
    response: responseText,
    formUpdates: Object.keys(formUpdates).length > 0 ? formUpdates : null,
    toolsUsed,
  };
}
