import {
    streamText,
    UIMessage,
    tool,
    convertToModelMessages,
    createUIMessageStreamResponse,
    toUIMessageStream,
} from "ai";
import { z } from 'zod';
import { google } from "@ai-sdk/google";

// Allow streaming responses up tp 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const SYSTEM_PROMPT = `You are an expert SQL assistance that helps users to query their database using natural language.
    You have access to following tools:
    1. db tool - call this tool to query the database.
    Rules:
    - Generate ONLY SELECT queries (no INSERT, UPDATE, DELETE, DROP)
    - Return valid SQLite syntax

    Always respond in a helpful, conversational tone while being technically accurate`;

    const result = streamText({
        model: google("gemini-3.5-flash-lite"),
        messages: await convertToModelMessages(messages),
        system: SYSTEM_PROMPT,
        tools: {
            db: tool({
                description: 'Call this tool to query a database',
                inputSchema: z.object({
                    query: z.string().describe('The SQL query to be ran'),
                }),
                execute: async ({ query }) => {
                    console.log('Query', query);
                    return query;
                },
            }),
        },
    });

    return createUIMessageStreamResponse({
        stream: toUIMessageStream({ stream: result.stream }),
    });
}



