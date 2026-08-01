import {
    streamText,
    UIMessage,
    tool,
    convertToModelMessages,
    createUIMessageStreamResponse,
    toUIMessageStream,
    stepCountIs,
} from "ai";
import { z } from 'zod';
import { google } from "@ai-sdk/google";
import { db } from "@/db/db";

// Allow streaming responses up tp 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const SYSTEM_PROMPT = `You are an expert SQL assistance that helps users to query their database using natural language.
    ${new Date().toLocaleString('sv-SE')}
    You have access to following tools:
    1. db tool - call this tool to query the database.
    2. schema tool - call this tool to get the database schema which will help you write SQL query.
    Rules:
    - Generate ONLY SELECT queries (no INSERT, UPDATE, DELETE, DROP)
    - Always use the schema provided by the schema tool
    - Pass in valid valid SQL syntax in db tool
    - IMPORTANT: To query database call db tool, don't return just SQL query

    Always respond in a helpful, conversational tone while being technically accurate`;

    const result = streamText({
        model: google("gemini-3.5-flash-lite"),
        messages: await convertToModelMessages(messages),
        system: SYSTEM_PROMPT,
        stopWhen: stepCountIs(5),
        tools: {
            schema: tool({
                description: 'Call this tool to get database schema information',
                inputSchema: z.object({}),
                execute: async () => {
                    return `
                        CREATE TABLE products (
                            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                            name text NOT NULL,
                            category text NOT NULL,
                            price real NOT NULL,
                            stock integer DEFAULT 0 NOT NULL,
                            created_at text DEFAULT CURRENT_TIMESTAMP
                        );
                        --> statement-breakpoint
                        CREATE TABLE sales (
                            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                            product_id integer NOT NULL,
                            quantity integer NOT NULL,
                            total_amount real NOT NULL,
                            sale_date text DEFAULT CURRENT_TIMESTAMP,
                            customer_name text NOT NULL,
                            region text NOT NULL,
                            FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE no action ON DELETE no action
                        );
                    `;
                },
            }),
            db: tool({
                description: 'Call this tool to query a database',
                inputSchema: z.object({
                    query: z.string().describe('The SQL query to be ran'),
                }),
                execute: async ({ query }) => {
                    // make sure no delete or update words in query
                    // return await db.run(query);
                    const result = await db.run(query);

                    return {
                        rows: result.rows,
                        columns: result.columns,
                    };
                },
            }),
        },
    });
    // return result.toUIMessageStreamResponse()

    return createUIMessageStreamResponse({
        stream: toUIMessageStream({ stream: result.stream }),
    });
}


