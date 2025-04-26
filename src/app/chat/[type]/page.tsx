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
    brief: `Please provide the following information about your app's UI requirements:\n1. What is the main purpose of your app?\n2. Who are your target users?\n3. What are the key features you want to include?\n4. Do you have any specific design preferences or inspiration?\n5. What platforms will your app support (web, mobile, both)?`,
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
    brief: `Please provide the following information about your app's UX requirements:\n1. What are the main user flows you want to implement?\n2. What are the key user interactions?\n3. How do you want users to navigate through your app?\n4. What are the main pain points you want to address?\n5. Do you have any specific accessibility requirements?`,
  },
  {
    key: "general",
    title: "General Audit",
    subtitle: "Comprehensive evaluation of business and technical aspects",
    icon: (
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
        <svg
          className="w-6 h-6 text-green-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 20V10" />
          <circle cx="12" cy="6" r="2" />
          <path d="M4 20h16" />
        </svg>
      </span>
    ),
    brief: `Please provide the following information about your app:\n1. What is the main problem your app solves?\n2. Who are your target users?\n3. What are your main competitors?\n4. What makes your app unique?\n5. What are your main technical requirements?`,
  },
];

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [auditType, setAuditType] = useState<AuditType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
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
        setMessages(JSON.parse(chatHistory));
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

  const handleCopy = async (brief: string, type: AuditType) => {
    await navigator.clipboard.writeText(brief);
    setCopied(type);
    setTimeout(() => setCopied(null), 1200);
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

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetchGeminiResponse(
        input,
        messages.map((m) => `${m.role}: ${m.content}`).join("\n")
      );

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

  if (!client) {
    return <div>Loading...</div>;
  }

  // Header
  if (client.type === "new_idea" && !auditType) {
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
                  <button
                    className="text-xs text-blue-600 hover:underline mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(type.brief, type.key as AuditType);
                    }}
                  >
                    {copied === type.key
                      ? "Copied!"
                      : "Click to copy brief questions to clipboard"}
                  </button>
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
