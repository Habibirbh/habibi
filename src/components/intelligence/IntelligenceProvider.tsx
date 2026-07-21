"use client";

import React, { createContext, useContext, useState } from "react";
import type { IntelligenceChatMessage } from "@/lib/intelligence/types";

interface IntelligenceContextType {
  isOpen: boolean;
  openAssistant: (initialPrompt?: string, propertySlug?: string) => void;
  closeAssistant: () => void;
  activePropertySlug: string | undefined;
  setActivePropertySlug: (slug: string | undefined) => void;
  messages: IntelligenceChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  hasPortfolioConsent: boolean;
  setHasPortfolioConsent: (consent: boolean) => void;
  clearHistory: () => void;
}

const IntelligenceContext = createContext<IntelligenceContextType | undefined>(undefined);

export function IntelligenceProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePropertySlug, setActivePropertySlug] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPortfolioConsent, setHasPortfolioConsent] = useState(false);

  const [messages, setMessages] = useState<IntelligenceChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      content:
        "Marhaba. I’m Habibi Intelligence.\n\nAsk me about a property, campaign, document, portfolio position, ownership structure, or UAE real estate market.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: [
        "Explain this property in simple terms.",
        "What are the main risks?",
        "Compare this with another Habibi property.",
        "What happens if the campaign fails?",
        "Summarize the campaign documents.",
        "How would this affect my portfolio?",
      ],
    },
  ]);

  const openAssistant = (initialPrompt?: string, propertySlug?: string) => {
    if (propertySlug) setActivePropertySlug(propertySlug);
    setIsOpen(true);

    if (initialPrompt) {
      sendMessage(initialPrompt);
    }
  };

  const closeAssistant = () => setIsOpen(false);

  const clearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        content: "Conversation history cleared. How can I assist you with UAE real estate today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: IntelligenceChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/intelligence/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.sender, content: m.content })),
          propertySlug: activePropertySlug,
          hasPortfolioConsent,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const assistantMsg: IntelligenceChatMessage = {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          content: data.reply,
          citations: data.citations,
          suggestedPrompts: data.suggestedPrompts,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          content: "I am having trouble connecting right now. Please try asking again shortly.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IntelligenceContext.Provider
      value={{
        isOpen,
        openAssistant,
        closeAssistant,
        activePropertySlug,
        setActivePropertySlug,
        messages,
        sendMessage,
        isLoading,
        hasPortfolioConsent,
        setHasPortfolioConsent,
        clearHistory,
      }}
    >
      {children}
    </IntelligenceContext.Provider>
  );
}

export function useIntelligence() {
  const context = useContext(IntelligenceContext);
  if (!context) {
    throw new Error("useIntelligence must be used within an IntelligenceProvider");
  }
  return context;
}
