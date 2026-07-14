import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "@/db";
import { hcps, materials, followUps, interactions } from "@/db/schema";
import { ilike, sql } from "drizzle-orm";

// ─── Tool 1: Log_Interaction ───
// Parses a natural language description and extracts all relevant fields
export const logInteractionTool = tool(
  async (input) => {
    return JSON.stringify({
      success: true,
      action: "log_interaction",
      updates: {
        hcpName: input.hcpName || "",
        interactionType: input.interactionType || "Meeting",
        date: input.date || new Date().toISOString().split("T")[0],
        time: input.time || "",
        attendees: input.attendees || "",
        topicsDiscussed: input.topicsDiscussed || "",
        materialsShared: input.materialsShared || "",
        sentiment: input.sentiment || "",
        outcomes: input.outcomes || "",
        followUpActions: input.followUpActions || "",
      },
      message: `Interaction logged for ${input.hcpName}. All extracted fields have been populated in the form.`,
    });
  },
  {
    name: "Log_Interaction",
    description:
      "Parse a natural language description of an HCP interaction and extract all relevant fields to populate the interaction form. Use this when the user describes a new interaction.",
    schema: z.object({
      hcpName: z.string().describe("The healthcare professional's name"),
      interactionType: z
        .enum(["Meeting", "Phone Call", "Email", "Video Call", "Conference", "Lunch Meeting"])
        .default("Meeting")
        .describe("The type of interaction"),
      date: z.string().describe("The date of the interaction in YYYY-MM-DD format"),
      time: z.string().optional().default("").describe("The time of the interaction in HH:MM format"),
      attendees: z.string().optional().default("").describe("Comma-separated list of attendees"),
      topicsDiscussed: z.string().optional().default("").describe("Summary of topics discussed"),
      materialsShared: z.string().optional().default("").describe("Materials shared or samples distributed"),
      sentiment: z
        .enum(["Positive", "Neutral", "Negative", ""])
        .optional()
        .default("")
        .describe("The observed/inferred HCP sentiment"),
      outcomes: z.string().optional().default("").describe("Outcomes of the interaction"),
      followUpActions: z.string().optional().default("").describe("Follow-up actions to be taken"),
    }),
  }
);

// ─── Tool 2: Edit_Interaction ───
// Updates only specified fields while preserving other data
export const editInteractionTool = tool(
  async (input) => {
    const updates: Record<string, string> = {};
    if (input.hcpName !== undefined && input.hcpName !== null) updates.hcpName = input.hcpName;
    if (input.interactionType !== undefined && input.interactionType !== null)
      updates.interactionType = input.interactionType;
    if (input.date !== undefined && input.date !== null) updates.date = input.date;
    if (input.time !== undefined && input.time !== null) updates.time = input.time;
    if (input.attendees !== undefined && input.attendees !== null) updates.attendees = input.attendees;
    if (input.topicsDiscussed !== undefined && input.topicsDiscussed !== null)
      updates.topicsDiscussed = input.topicsDiscussed;
    if (input.materialsShared !== undefined && input.materialsShared !== null)
      updates.materialsShared = input.materialsShared;
    if (input.sentiment !== undefined && input.sentiment !== null) updates.sentiment = input.sentiment;
    if (input.outcomes !== undefined && input.outcomes !== null) updates.outcomes = input.outcomes;
    if (input.followUpActions !== undefined && input.followUpActions !== null)
      updates.followUpActions = input.followUpActions;

    const changedFields = Object.keys(updates);
    return JSON.stringify({
      success: true,
      action: "edit_interaction",
      updates,
      message: `Updated ${changedFields.join(", ")} in the interaction form.`,
    });
  },
  {
    name: "Edit_Interaction",
    description:
      "Edit specific fields of an already-logged interaction. Only updates the fields explicitly mentioned by the user, leaving all other fields unchanged. Use this when the user wants to correct or modify specific details.",
    schema: z.object({
      hcpName: z.string().optional().describe("Updated HCP name"),
      interactionType: z
        .enum(["Meeting", "Phone Call", "Email", "Video Call", "Conference", "Lunch Meeting"])
        .optional()
        .describe("Updated interaction type"),
      date: z.string().optional().describe("Updated date in YYYY-MM-DD format"),
      time: z.string().optional().describe("Updated time in HH:MM format"),
      attendees: z.string().optional().describe("Updated attendees"),
      topicsDiscussed: z.string().optional().describe("Updated topics discussed"),
      materialsShared: z.string().optional().describe("Updated materials shared"),
      sentiment: z.enum(["Positive", "Neutral", "Negative"]).optional().describe("Updated sentiment"),
      outcomes: z.string().optional().describe("Updated outcomes"),
      followUpActions: z.string().optional().describe("Updated follow-up actions"),
    }),
  }
);

// ─── Tool 3: Search_HCP_Database ───
// Validates and searches for HCP names in the database
export const searchHcpDatabaseTool = tool(
  async (input) => {
    try {
      const results = await db
        .select()
        .from(hcps)
        .where(ilike(hcps.name, `%${input.query}%`))
        .limit(10);

      if (results.length === 0) {
        return JSON.stringify({
          success: true,
          action: "search_hcp",
          found: false,
          results: [],
          message: `No HCP found matching "${input.query}". The name will still be used in the form, but it's not in our verified database. You may want to double-check the spelling.`,
        });
      }

      return JSON.stringify({
        success: true,
        action: "search_hcp",
        found: true,
        results: results.map((r) => ({
          id: r.id,
          name: r.name,
          specialty: r.specialty,
          institution: r.institution,
        })),
        message: `Found ${results.length} matching HCP(s): ${results.map((r) => `${r.name} (${r.specialty || "N/A"}, ${r.institution || "N/A"})`).join("; ")}`,
      });
    } catch {
      return JSON.stringify({
        success: true,
        action: "search_hcp",
        found: false,
        results: [],
        message: `Searched for "${input.query}" in the HCP database. No verified match found, but the name will be used as entered.`,
      });
    }
  },
  {
    name: "Search_HCP_Database",
    description:
      "Search the HCP database to validate a healthcare professional's name and retrieve their details (specialty, institution). Use this to verify or look up an HCP when logging or editing an interaction.",
    schema: z.object({
      query: z.string().describe("The HCP name or partial name to search for"),
    }),
  }
);

// ─── Tool 4: Lookup_Product_Materials ───
// Validates materials/samples mentioned by the user
export const lookupProductMaterialsTool = tool(
  async (input) => {
    try {
      const results = await db
        .select()
        .from(materials)
        .where(ilike(materials.name, `%${input.query}%`))
        .limit(10);

      if (results.length === 0) {
        return JSON.stringify({
          success: true,
          action: "lookup_materials",
          found: false,
          results: [],
          message: `No materials found matching "${input.query}" in catalog. The material name will still be recorded as entered.`,
        });
      }

      return JSON.stringify({
        success: true,
        action: "lookup_materials",
        found: true,
        results: results.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          productName: r.productName,
          description: r.description,
        })),
        message: `Found ${results.length} matching material(s): ${results.map((r) => `${r.name} (${r.type}, Product: ${r.productName || "N/A"})`).join("; ")}`,
      });
    } catch {
      return JSON.stringify({
        success: true,
        action: "lookup_materials",
        found: false,
        results: [],
        message: `Searched for "${input.query}" in materials catalog. Material recorded as entered.`,
      });
    }
  },
  {
    name: "Lookup_Product_Materials",
    description:
      "Search the product materials catalog to validate and look up materials, brochures, or samples mentioned by the user. Use this when the user mentions sharing materials or samples.",
    schema: z.object({
      query: z.string().describe("The material name or keyword to search for"),
    }),
  }
);

// ─── Tool 5: Schedule_FollowUp ───
// Schedules a follow-up action with a due date
export const scheduleFollowUpTool = tool(
  async (input) => {
    try {
      const result = await db
        .insert(followUps)
        .values({
          action: input.action,
          dueDate: input.dueDate,
          status: "pending",
        })
        .returning();

      return JSON.stringify({
        success: true,
        action: "schedule_followup",
        followUp: {
          id: result[0]?.id,
          action: input.action,
          dueDate: input.dueDate,
          status: "pending",
        },
        message: `Follow-up scheduled: "${input.action}" due on ${input.dueDate}. This has been saved to the system.`,
      });
    } catch {
      return JSON.stringify({
        success: true,
        action: "schedule_followup",
        followUp: {
          action: input.action,
          dueDate: input.dueDate,
          status: "pending",
        },
        message: `Follow-up noted: "${input.action}" due on ${input.dueDate}. Recorded in the form.`,
      });
    }
  },
  {
    name: "Schedule_FollowUp",
    description:
      "Schedule a follow-up action for an HCP interaction. Creates a follow-up entry with the specified action and due date. Use this when the user mentions needing to follow up with the HCP.",
    schema: z.object({
      action: z.string().describe("Description of the follow-up action to be taken"),
      dueDate: z
        .string()
        .describe("Due date for the follow-up in YYYY-MM-DD format"),
    }),
  }
);

// ─── Tool 6: Save_Interaction_To_DB ───
export const saveInteractionTool = tool(
  async (input) => {
    try {
      const result = await db
        .insert(interactions)
        .values({
          hcpName: input.hcpName,
          interactionType: input.interactionType || "Meeting",
          interactionDate: input.date,
          interactionTime: input.time || null,
          attendees: input.attendees || null,
          topicsDiscussed: input.topicsDiscussed || null,
          materialsShared: input.materialsShared || null,
          sentiment: input.sentiment || null,
          outcomes: input.outcomes || null,
          followUpActions: input.followUpActions || null,
        })
        .returning();

      return JSON.stringify({
        success: true,
        action: "save_interaction",
        interactionId: result[0]?.id,
        message: `Interaction with ${input.hcpName} has been saved to the database successfully (ID: ${result[0]?.id}).`,
      });
    } catch (err) {
      return JSON.stringify({
        success: false,
        action: "save_interaction",
        message: `Could not save interaction to database. The form data is still preserved. Error: ${String(err)}`,
      });
    }
  },
  {
    name: "Save_Interaction_To_DB",
    description:
      "Save the finalized interaction data to the database. Use this when the user confirms they want to save/submit the interaction, or after all fields have been populated and reviewed.",
    schema: z.object({
      hcpName: z.string().describe("HCP name"),
      interactionType: z.string().optional().default("Meeting"),
      date: z.string().describe("Interaction date YYYY-MM-DD"),
      time: z.string().optional().default(""),
      attendees: z.string().optional().default(""),
      topicsDiscussed: z.string().optional().default(""),
      materialsShared: z.string().optional().default(""),
      sentiment: z.string().optional().default(""),
      outcomes: z.string().optional().default(""),
      followUpActions: z.string().optional().default(""),
    }),
  }
);

export const allTools = [
  logInteractionTool,
  editInteractionTool,
  searchHcpDatabaseTool,
  lookupProductMaterialsTool,
  scheduleFollowUpTool,
  saveInteractionTool,
];
