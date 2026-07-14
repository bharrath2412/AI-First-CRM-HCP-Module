"use client";

import type { InteractionFormState } from "@/lib/types";

interface InteractionFormProps {
  formState: InteractionFormState;
  highlightedFields: Set<string>;
}

function FieldWrapper({
  label,
  fieldKey,
  highlighted,
  children,
  icon,
}: {
  label: string;
  fieldKey: string;
  highlighted: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`transition-all duration-300 rounded-lg ${highlighted ? "field-highlight ring-2 ring-blue-300" : ""}`}
    >
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
        {icon}
        {label}
        {highlighted && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 animate-fade-in">
            Updated
          </span>
        )}
      </label>
      <div data-field={fieldKey}>{children}</div>
    </div>
  );
}

export default function InteractionForm({ formState, highlightedFields }: InteractionFormProps) {
  const isHighlighted = (key: string) => highlightedFields.has(key);
  const hasData = formState.hcpName || formState.topicsDiscussed || formState.sentiment;

  return (
    <div className="p-6">
      {/* Form Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Interaction Details
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Fields are populated automatically by the AI Assistant
          </p>
        </div>
        {hasData && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Data Logged
          </span>
        )}
      </div>

      {/* Lock Notice */}
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-amber-800">Form is AI-controlled</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Use the chat assistant on the right to populate and edit these fields.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* HCP Name */}
        <FieldWrapper
          label="HCP Name"
          fieldKey="hcpName"
          highlighted={isHighlighted("hcpName")}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <div className="relative">
            <input
              type="text"
              value={formState.hcpName}
              readOnly
              disabled
              placeholder="e.g., Dr. Sarah Smith"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-not-allowed placeholder:text-slate-400 disabled:opacity-70"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </FieldWrapper>

        {/* Interaction Type & Date/Time Row */}
        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper
            label="Interaction Type"
            fieldKey="interactionType"
            highlighted={isHighlighted("interactionType")}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
          >
            <select
              value={formState.interactionType}
              disabled
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-not-allowed appearance-none disabled:opacity-70"
            >
              <option value="Meeting">Meeting</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Email">Email</option>
              <option value="Video Call">Video Call</option>
              <option value="Conference">Conference</option>
              <option value="Lunch Meeting">Lunch Meeting</option>
            </select>
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper
              label="Date"
              fieldKey="date"
              highlighted={isHighlighted("date")}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            >
              <input
                type="date"
                value={formState.date}
                readOnly
                disabled
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-not-allowed disabled:opacity-70"
              />
            </FieldWrapper>

            <FieldWrapper
              label="Time"
              fieldKey="time"
              highlighted={isHighlighted("time")}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <input
                type="time"
                value={formState.time}
                readOnly
                disabled
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-not-allowed disabled:opacity-70"
              />
            </FieldWrapper>
          </div>
        </div>

        {/* Attendees */}
        <FieldWrapper
          label="Attendees"
          fieldKey="attendees"
          highlighted={isHighlighted("attendees")}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        >
          <input
            type="text"
            value={formState.attendees}
            readOnly
            disabled
            placeholder="e.g., John Doe, Jane Smith"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-not-allowed placeholder:text-slate-400 disabled:opacity-70"
          />
        </FieldWrapper>

        {/* Topics Discussed */}
        <FieldWrapper
          label="Topics Discussed"
          fieldKey="topicsDiscussed"
          highlighted={isHighlighted("topicsDiscussed")}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          }
        >
          <textarea
            value={formState.topicsDiscussed}
            readOnly
            disabled
            placeholder="Topics discussed during the interaction..."
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-not-allowed placeholder:text-slate-400 resize-none disabled:opacity-70"
          />
        </FieldWrapper>

        {/* Materials Shared */}
        <FieldWrapper
          label="Materials Shared / Samples Distributed"
          fieldKey="materialsShared"
          highlighted={isHighlighted("materialsShared")}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        >
          <div className="relative">
            <input
              type="text"
              value={formState.materialsShared}
              readOnly
              disabled
              placeholder="e.g., CardioMax Brochure, Product Samples"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-not-allowed placeholder:text-slate-400 disabled:opacity-70"
            />
            <div className="flex gap-2 mt-2">
              <button
                disabled
                className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-md cursor-not-allowed flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
              <button
                disabled
                className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-md cursor-not-allowed flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>
          </div>
        </FieldWrapper>

        {/* Sentiment */}
        <FieldWrapper
          label="Observed / Inferred HCP Sentiment"
          fieldKey="sentiment"
          highlighted={isHighlighted("sentiment")}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <div className="flex gap-4">
            {(["Positive", "Neutral", "Negative"] as const).map((s) => (
              <label
                key={s}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-not-allowed transition-all ${
                  formState.sentiment === s
                    ? s === "Positive"
                      ? "bg-green-50 border-green-300 text-green-700"
                      : s === "Neutral"
                        ? "bg-amber-50 border-amber-300 text-amber-700"
                        : "bg-red-50 border-red-300 text-red-700"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                <input
                  type="radio"
                  name="sentiment"
                  value={s}
                  checked={formState.sentiment === s}
                  readOnly
                  disabled
                  className="cursor-not-allowed"
                />
                <span className="text-sm font-medium">
                  {s === "Positive" ? "😊" : s === "Neutral" ? "😐" : "😟"} {s}
                </span>
              </label>
            ))}
          </div>
        </FieldWrapper>

        {/* Outcomes */}
        <FieldWrapper
          label="Outcomes"
          fieldKey="outcomes"
          highlighted={isHighlighted("outcomes")}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <textarea
            value={formState.outcomes}
            readOnly
            disabled
            placeholder="Key outcomes from the interaction..."
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-not-allowed placeholder:text-slate-400 resize-none disabled:opacity-70"
          />
        </FieldWrapper>

        {/* Follow-up Actions */}
        <FieldWrapper
          label="Follow-up Actions"
          fieldKey="followUpActions"
          highlighted={isHighlighted("followUpActions")}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <textarea
            value={formState.followUpActions}
            readOnly
            disabled
            placeholder="Planned follow-up actions..."
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-not-allowed placeholder:text-slate-400 resize-none disabled:opacity-70"
          />
        </FieldWrapper>
      </div>
    </div>
  );
}
