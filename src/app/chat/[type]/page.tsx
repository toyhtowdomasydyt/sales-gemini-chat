"use client";

import { useEffect, useState, useRef } from "react";
import { AuditType, Message, Client } from "@/types";
import { fetchGeminiResponse } from "@/lib/gemini";
import ReactMarkdown from "react-markdown";

const AUDIT_TYPES = [
  {
    key: "ui",
    title: "UI Audit",
    subtitle: "Evaluate visual design, layout, and interface elements",
    icon: (
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
        <svg
          className="w-6 h-6 text-blue-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M4 9h16" />
        </svg>
      </span>
    ),
    brief: `Please provide the information about your app's UI requirements`,
  },
  {
    key: "ux",
    title: "UX Audit",
    subtitle: "Analyze user flows, interactions, and experience patterns",
    icon: (
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100">
        <svg
          className="w-6 h-6 text-purple-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
      </span>
    ),
    brief: `Please provide the information about your app's UX requirements`,
  },
];

const IDEA_CONTEXT = `You are an expert product consultant. When a user describes a new app idea, respond using the following structure:

**Just an Idea:**
Summarize the user's idea in your own words.

**Solution:**
Describe a possible solution or approach to realize the idea.

**Artefact:**
List the main deliverables or features that would be created.

**Outcome:**
Describe the expected impact or value for the user/client.

Format your response in markdown with clear headings for each section.`;

const UX_AUDIT_CONTEXT = `You are an expert UX consultant. When a user describes their existing app and requests a UX audit, respond using the following structure:

**UX Audit:**
Summarize the main UX issues or opportunities based on the user's input.

**Artefact:**
List the main deliverables or recommendations you would provide as part of the audit.

**Outcome:**
Describe the expected impact or value for the user/client if these recommendations are implemented.

Format your response in markdown with clear headings for each section.`;

const UI_AUDIT_CONTEXT = `You are an expert UI consultant. When a user describes their existing app and requests a UI audit, respond using the following structure:

**UI Audit:**
Summarize the main UI issues or opportunities based on the user's input.

**Artefact:**
List the main deliverables or recommendations you would provide as part of the audit.

**Outcome:**
Describe the expected impact or value for the user/client if these recommendations are implemented.

Format your response in markdown with clear headings for each section.`;

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [auditType, setAuditType] = useState<AuditType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load client and chat history on mount
  useEffect(() => {
    const storedClient = localStorage.getItem("currentClient");
    if (storedClient) {
      const parsedClient = JSON.parse(storedClient);
      setClient(parsedClient);
      // Load chat history for this client
      const chatHistory = localStorage.getItem(
        `chatHistory:${parsedClient.id}`
      );
      if (chatHistory) {
        const parsedHistory = JSON.parse(chatHistory);
        setMessages(parsedHistory);
        // If new_idea and no chat history, show a custom welcome message
        if (parsedClient.type === "new_idea" && parsedHistory.length === 0) {
          setMessages([
            {
              id: Date.now().toString(),
              clientId: parsedClient.id,
              role: "assistant",
              content:
                "Welcome! Please describe your new app idea. Share as much detail as you can about the concept, goals, and any features you have in mind. I'll help you shape your idea into a great product!",
              createdAt: new Date(),
            },
          ]);
        }
      } else if (parsedClient.type === "new_idea") {
        setMessages([
          {
            id: Date.now().toString(),
            clientId: parsedClient.id,
            role: "assistant",
            content:
              "Welcome! Please describe your new app idea. Share as much detail as you can about the concept, goals, and any features you have in mind. I'll help you shape your idea into a great product!",
            createdAt: new Date(),
          },
        ]);
      }
      // Set auditType if present
      if (parsedClient.auditType) setAuditType(parsedClient.auditType);
    }
  }, []);

  // Persist chat history and update client updatedAt in clients list
  useEffect(() => {
    if (client) {
      localStorage.setItem(
        `chatHistory:${client.id}`,
        JSON.stringify(messages)
      );
      // Update updatedAt in clients list
      const clients = JSON.parse(localStorage.getItem("clients") || "[]");
      const idx = clients.findIndex((c: Client) => c.id === client.id);
      if (idx !== -1) {
        clients[idx] = { ...clients[idx], updatedAt: new Date() };
        localStorage.setItem("clients", JSON.stringify(clients));
      }
    }
  }, [messages, client]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // When auditType is selected, persist to client and clients list
  const handleAuditTypeSelect = (type: AuditType, brief: string) => {
    setAuditType(type);
    if (client) {
      const updatedClient = {
        ...client,
        auditType: type,
        updatedAt: new Date(),
      };
      setClient(updatedClient);
      localStorage.setItem("currentClient", JSON.stringify(updatedClient));
      // Update in clients list
      const clients = JSON.parse(localStorage.getItem("clients") || "[]");
      const idx = clients.findIndex((c: Client) => c.id === client.id);
      if (idx !== -1) {
        clients[idx] = updatedClient;
        localStorage.setItem("clients", JSON.stringify(clients));
      }
    }
    const initialMessage: Message = {
      id: Date.now().toString(),
      clientId: client!.id,
      role: "assistant",
      content: brief,
      createdAt: new Date(),
    };
    setMessages([initialMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !client) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      clientId: client.id,
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    const isFirstUserMessageForIdea =
      client.type === "new_idea" &&
      messages.length === 1 &&
      messages[0].role === "assistant";
    const isFirstUserMessageForUXAudit =
      client.type === "improvement" &&
      client.auditType === "ux" &&
      ((messages.length === 1 && messages[0].role === "assistant") ||
        messages.length === 0);
    const isFirstUserMessageForUIAudit =
      client.type === "improvement" &&
      client.auditType === "ui" &&
      ((messages.length === 1 && messages[0].role === "assistant") ||
        messages.length === 0);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let context;
      if (isFirstUserMessageForIdea) {
        context = IDEA_CONTEXT;
      } else if (isFirstUserMessageForUXAudit) {
        context = UX_AUDIT_CONTEXT;
      } else if (isFirstUserMessageForUIAudit) {
        context = UI_AUDIT_CONTEXT;
      } else {
        context = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
      }
      const response = await fetchGeminiResponse(input, context);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        clientId: client.id,
        role: "assistant",
        content: response,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove auditType from client when new project idea is selected
  useEffect(() => {
    if (client && client.type === "new_idea" && client.auditType) {
      const updatedClient = { ...client };
      delete updatedClient.auditType;
      setClient(updatedClient);
      localStorage.setItem("currentClient", JSON.stringify(updatedClient));
      // Update in clients list
      const clients = JSON.parse(localStorage.getItem("clients") || "[]");
      const idx = clients.findIndex((c: Client) => c.id === client.id);
      if (idx !== -1) {
        clients[idx] = updatedClient;
        localStorage.setItem("clients", JSON.stringify(clients));
      }
    }
    // eslint-disable-next-line
  }, [client && client.type === "new_idea"]);

  // Only show audit type selection for 'improvement' type and if auditType is not set
  const shouldShowAuditTypeSelection =
    client?.type === "improvement" && !auditType;

  if (!client) {
    return <div>Loading...</div>;
  }

  // Header
  if (shouldShowAuditTypeSelection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="flex items-center justify-between px-8 py-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100">
              <svg
                className="w-6 h-6 text-purple-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M8 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </span>
            <div>
              <div className="font-semibold text-lg text-gray-900">
                New App Idea
              </div>
              <div className="text-sm text-gray-500">{client.name}</div>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto py-12 px-4">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">
            Select Audit Type
          </h2>
          <div className="space-y-6">
            {AUDIT_TYPES.map((type) => (
              <div
                key={type.key}
                className="flex items-center gap-6 p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() =>
                  handleAuditTypeSelect(type.key as AuditType, type.brief)
                }
              >
                {type.icon}
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900">
                    {type.title}
                  </div>
                  <div className="text-gray-500 mb-1">{type.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Chat UI
  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col">
      <header className="flex items-center justify-between px-8 py-6 border-b bg-white">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100">
            <svg
              className="w-6 h-6 text-purple-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M8 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </span>
          <div>
            <div className="font-semibold text-lg text-gray-900">
              {client.type === "new_idea" ? "New App Idea" : "App Enhancement"}
            </div>
            <div className="text-sm text-gray-500">{client.name}</div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full pb-8">
        <div className="flex-1 px-4 pt-8 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "assistant" ? "" : "justify-end"
              }`}
            >
              {message.role === "assistant" && (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 mr-3 mt-1">
                  <svg
                    className="w-5 h-5 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </span>
              )}
              <div
                className={`rounded-2xl px-5 py-4 ${
                  message.role === "assistant" ? "bg-white" : "bg-indigo-50"
                } border border-gray-200 shadow-sm`}
                style={{ maxWidth: "80%" }}
              >
                {message.role === "assistant" ? (
                  <div
                    className="prose max-w-none text-gray-900 text-base leading-relaxed break-words"
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        table: (props) => (
                          <div className="overflow-x-auto">
                            <table
                              className="min-w-[600px] border-collapse"
                              {...props}
                            />
                          </div>
                        ),
                        th: (props) => (
                          <th
                            className="border px-2 py-1 bg-gray-100 text-xs"
                            {...props}
                          />
                        ),
                        td: (props) => (
                          <td
                            className="border px-2 py-1 align-top text-xs"
                            {...props}
                          />
                        ),
                        pre: (props) => (
                          <pre
                            className="bg-gray-100 rounded p-2 overflow-x-auto text-xs !mb-2"
                            style={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                            {...props}
                          />
                        ),
                        code: (props) => (
                          <code
                            className="bg-gray-100 rounded px-1 text-xs"
                            style={{
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                            {...props}
                          />
                        ),
                        p: (props) => (
                          <p className="mb-2 last:mb-0" {...props} />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div
                    className="text-gray-900 text-base whitespace-pre-line leading-relaxed break-words overflow-x-auto"
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {message.content}
                  </div>
                )}
                <div className="text-xs text-gray-400 text-right mt-2">
                  {formatTime(new Date(message.createdAt))}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 mr-3 mt-1">
                <svg
                  className="w-5 h-5 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </span>
              <div
                className="rounded-2xl px-5 py-4 bg-white border border-gray-200 shadow-sm"
                style={{ maxWidth: "80%" }}
              >
                <div className="text-gray-900 text-base">Thinking...</div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 px-4 mt-4"
        >
          <div className="flex items-center flex-1 bg-[#f8f9fb] rounded-full border border-gray-200 px-4 py-3 focus-within:border-indigo-400 transition-all duration-150 shadow-none">
            <label
              htmlFor="file-upload"
              className="cursor-pointer mr-3 flex items-center"
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M16.5 13.5L7.5 4.5M21 15.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h3" />
                <path d="M16.5 13.5a2.121 2.121 0 1 1-3-3l7.5-7.5a2.121 2.121 0 0 1 3 3l-7.5 7.5z" />
              </svg>
              <input id="file-upload" type="file" className="hidden" disabled />
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border-none outline-none bg-transparent text-gray-900 text-base placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="ml-3 inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-indigo-600 transition disabled:opacity-50 bg-transparent border-none p-0"
              style={{ boxShadow: "none" }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
