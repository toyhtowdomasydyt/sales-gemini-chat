"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Client } from "@/types";

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const router = useRouter();

  // Load clients from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("clients");
    if (stored) {
      setClients(JSON.parse(stored));
    }
  }, []);

  // Save clients to localStorage
  const saveClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem("clients", JSON.stringify(newClients));
  };

  // Select an existing client
  const handleSelectClient = (client: Client) => {
    localStorage.setItem("currentClient", JSON.stringify(client));
    // Load chat history for this client
    const chatHistory = localStorage.getItem(`chatHistory:${client.id}`);
    if (!chatHistory) {
      localStorage.setItem(`chatHistory:${client.id}`, JSON.stringify([]));
    }
    if (client.type === "new_idea") {
      router.push(`/chat/new_idea`);
    } else if (client.auditType) {
      router.push(`/chat/${client.type}`);
    } else {
      router.push("/select-type");
    }
  };

  // Create a new client
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return;
    const newClient: Client = {
      id: Date.now().toString(),
      name: clientName,
      company: companyName,
      type: "new_idea", // default, will be set in next step
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedClients = [newClient, ...clients];
    saveClients(updatedClients);
    localStorage.setItem("currentClient", JSON.stringify(newClient));
    localStorage.setItem(`chatHistory:${newClient.id}`, JSON.stringify([]));
    setShowForm(false);
    setClientName("");
    setCompanyName("");
    router.push("/select-type");
  };

  // Filtered clients by search
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Select or Create Client
          </h1>
          {!showForm && (
            <button
              className="text-blue-600 font-medium hover:underline"
              onClick={() => setShowForm(true)}
            >
              + New Client
            </button>
          )}
        </div>
        {!showForm ? (
          <>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredClients.length === 0 && (
                <div className="text-gray-500 text-center py-8">
                  No clients found.
                </div>
              )}
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 transition flex flex-col"
                >
                  <span className="font-semibold text-gray-900">
                    {client.name}
                  </span>
                  {client.company && (
                    <span className="text-gray-500 text-sm">
                      {client.company}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleCreateClient} className="space-y-6">
            <div>
              <label
                htmlFor="clientName"
                className="block text-sm font-semibold text-gray-800 mb-1"
              >
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-semibold text-gray-800 mb-1"
              >
                Company Name (Optional)
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                className="text-gray-700 font-medium hover:underline"
                onClick={() => {
                  setShowForm(false);
                  setClientName("");
                  setCompanyName("");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-md shadow hover:bg-blue-700 disabled:opacity-50"
                disabled={!clientName}
              >
                Create Client
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
