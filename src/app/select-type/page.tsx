"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Client, ClientType } from "@/types";

const AUDIT_OPTIONS = [
  {
    key: "new_idea",
    title: "New App Idea",
    subtitle:
      "Explore a new application concept and get insights on development",
    icon: (
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100">
        <svg
          className="w-8 h-8 text-blue-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 2v6m0 0l2-2m-2 2l-2-2m2 2v6m0 0l2-2m-2 2l-2-2m2 2v6m0 0l2-2m-2 2l-2-2" />
        </svg>
      </span>
    ),
  },
  {
    key: "improvement",
    title: "App Enhancement",
    subtitle:
      "Improve an existing application with new features or optimizations",
    icon: (
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-100">
        <svg
          className="w-8 h-8 text-purple-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6M16.243 7.757a6 6 0 1 1-8.486 8.486 6 6 0 0 1 8.486-8.486z" />
        </svg>
      </span>
    ),
  },
];

export default function SelectTypePage() {
  const [client, setClient] = useState<Client | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("currentClient");
    if (stored) setClient(JSON.parse(stored));
  }, []);

  const handleSelectType = (type: ClientType) => {
    if (!client) return;
    const updatedClient = { ...client, type, updatedAt: new Date() };
    localStorage.setItem("currentClient", JSON.stringify(updatedClient));
    // Update in clients list as well
    const clients = JSON.parse(localStorage.getItem("clients") || "[]");
    const idx = clients.findIndex((c: Client) => c.id === client.id);
    if (idx !== -1) {
      clients[idx] = updatedClient;
      localStorage.setItem("clients", JSON.stringify(clients));
    }
    router.push(`/chat/${type}`);
  };

  if (!client)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

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
              AI Sales Assistant
            </div>
            <div className="text-sm text-gray-500">{client.name}</div>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">
          What would you like to explore today?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {AUDIT_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => handleSelectType(option.key as ClientType)}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl border bg-white shadow-sm hover:shadow-md transition cursor-pointer focus:outline-none"
            >
              {option.icon}
              <div className="font-semibold text-xl text-gray-900 mt-2">
                {option.title}
              </div>
              <div className="text-gray-500 text-center text-base">
                {option.subtitle}
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
