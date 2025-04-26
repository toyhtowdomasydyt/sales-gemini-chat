export type ClientType = "new_idea" | "improvement";

export type AuditType = "ui" | "ux" | "general";

export interface Client {
  id: string;
  name: string;
  company?: string;
  type: ClientType;
  auditType?: AuditType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  clientId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ChatHistory {
  clientId: string;
  messages: Message[];
}
