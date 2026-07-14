export interface InteractionFormState {
  hcpName: string;
  interactionType: string;
  date: string;
  time: string;
  attendees: string;
  topicsDiscussed: string;
  materialsShared: string;
  sentiment: "Positive" | "Neutral" | "Negative" | "";
  outcomes: string;
  followUpActions: string;
}

export const emptyFormState: InteractionFormState = {
  hcpName: "",
  interactionType: "Meeting",
  date: "",
  time: "",
  attendees: "",
  topicsDiscussed: "",
  materialsShared: "",
  sentiment: "",
  outcomes: "",
  followUpActions: "",
};

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  formUpdates: Partial<InteractionFormState> | null;
  toolsUsed: string[];
}
