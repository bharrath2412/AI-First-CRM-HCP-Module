# AI-Driven HCP Interaction Logger

An intelligent web application designed for pharmaceutical sales representatives to efficiently log interactions with Healthcare Professionals (HCPs) through natural language conversations.

## 🚀 Features

- **Conversational Logging**: Simply type or speak your interaction details (e.g., *"Today I met with Dr. Smith and discussed product X efficiency. The sentiment was positive..."*), and the AI automatically parses and fills out the structured form.
- **Smart Entity Extraction**: Automatically extracts HCP names, meeting dates/times, topics discussed, materials shared, attendees, outcomes, and follow-up actions.
- **Graceful Fallback**: If the OpenAI API is unavailable or rate-limited (e.g. quota limits), the system seamlessly falls back to a built-in structured logic parser so you can continue logging without interruption.
- **Real-time Corrections**: Update specific fields interactively just by chatting (e.g., *"Actually, the sentiment was negative"*).
- **PostgreSQL Database**: Built with robust database integration using Drizzle ORM.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI / Agents**: LangChain (`@langchain/core`, `@langchain/langgraph`, `@langchain/groq`), Groq API (llama-3.1-8b-instant)
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL (running locally or accessible via a cloud provider)
- An API Key (e.g., Groq)

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory of the project (if it doesn't already exist) and configure the following variables:

```env
# Database configuration
# Format: postgresql://username:password@host:port/database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/app_db"

# Groq API key for the conversational AI agent
# Get your key from https://console.groq.com/keys
GROQ_API_KEY="your-groq-api-key"
```

### 3. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📂 Key Files

- `src/lib/agent/graph.ts`: The core logic for the LangChain agent. It manages the LLM model invocation, tool binding, and the graceful fallback parsing system.
- `src/app/api/chat/route.ts`: The Next.js API route that handles communication between the frontend client and the LangChain backend.
- `.env.local`: Environment configuration (excluded from version control).

## 📄 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run start`: Runs the built production app.
- `npm run lint`: Runs ESLint for code quality.
- `npm run typecheck`: Runs TypeScript type-checking without emitting files.
