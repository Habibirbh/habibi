"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Sparkles, ShieldCheck, Trash2, ArrowUpRight } from "lucide-react";
import { useIntelligence } from "./IntelligenceProvider";
import { campaignBySlug } from "@/lib/web3/campaigns";
import type { Citation } from "@/lib/intelligence/types";

export function HabibiAssistantDrawer() {
  const {
    isOpen,
    openAssistant,
    closeAssistant,
    activePropertySlug,
    messages,
    sendMessage,
    isLoading,
    clearHistory,
    hasPortfolioConsent,
    setHasPortfolioConsent,
  } = useIntelligence();

  const [input, setInput] = useState("");
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeCampaign = activePropertySlug ? campaignBySlug(activePropertySlug) : undefined;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <>
      {/* Floating Action Button with Habibi Cat & Lime Indicator */}
      <button
        onClick={() => openAssistant()}
        aria-label="Open Habibi Intelligence Assistant"
        className="focus-lime fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-ink/10 bg-ink shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-black group"
      >
        <div className="relative h-9 w-9 overflow-hidden rounded-full border border-surface/20">
          <Image src="/logo.PNG" alt="Habibi Cat" fill className="object-cover" />
        </div>
        {/* Lime Pulse Indicator */}
        <span className="absolute right-1 top-1 flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-ink bg-lime" />
        </span>
      </button>

      {/* Drawer / Sheet Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAssistant}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs"
            />

            {/* Desktop Panel / Mobile Sheet */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l border-line bg-surface shadow-2xl sm:max-w-[460px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line bg-bg px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-ink/10 bg-ink">
                    <Image src="/logo.PNG" alt="Habibi AI" fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-ink">Habibi Intelligence</h3>
                    <p className="text-[0.72rem] font-medium text-muted">
                      {activeCampaign ? `Context: ${activeCampaign.name}` : "UAE Real Estate Assistant"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearHistory}
                    title="Clear Conversation"
                    className="rounded-full p-2 text-muted hover:bg-bg2 hover:text-ink transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={closeAssistant}
                    className="rounded-full p-2 text-ink hover:bg-bg2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Portfolio Consent Banner */}
              <div className="border-b border-line bg-bg2/40 px-5 py-2.5 text-[0.75rem] text-muted flex items-center justify-between">
                <span>Personalize using portfolio data?</span>
                <button
                  onClick={() => setHasPortfolioConsent(!hasPortfolioConsent)}
                  className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                    hasPortfolioConsent ? "bg-lime text-ink" : "bg-ink/10 text-ink"
                  }`}
                >
                  {hasPortfolioConsent ? "Consent Active" : "Allow Consent"}
                </button>
              </div>

              {/* Chat Conversation Scroll Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-[0.88rem] leading-relaxed shadow-xs ${
                        msg.sender === "user"
                          ? "bg-ink text-surface rounded-br-none"
                          : "bg-bg2 border border-line text-ink rounded-bl-none"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 border-t border-line/40 pt-2.5">
                          <p className="text-[0.7rem] uppercase tracking-wider text-muted font-medium mb-1.5">
                            Verified Sources
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => setSelectedCitation(c)}
                                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[0.7rem] font-medium text-ink hover:border-ink hover:bg-lime/20 transition-colors"
                              >
                                <span>{c.title}</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Suggested Prompts */}
                    {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {msg.suggestedPrompts.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(prompt)}
                            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[0.76rem] font-medium text-ink/80 hover:border-ink hover:text-ink transition-colors text-left"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="mt-1 text-[0.68rem] text-muted">{msg.timestamp}</span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-[0.8rem] font-medium text-muted">
                    <Sparkles className="h-4 w-4 animate-spin text-lime" />
                    <span>Habibi Intelligence is analyzing data…</span>
                  </div>
                )}
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSubmit} className="border-t border-line bg-surface p-4">
                <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-bg px-3.5 py-2 focus-within:border-ink">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about properties, risks, documents…"
                    className="w-full bg-transparent text-[0.88rem] text-ink outline-none placeholder:text-muted/60"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="rounded-lg bg-ink p-2 text-surface hover:bg-lime hover:text-ink transition-colors disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[0.68rem] text-muted">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-lime" /> Read-only AI Assistant
                  </span>
                  <span>Chain ID: 4663</span>
                </div>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Citation Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h4 className="font-serif text-lg text-ink">{selectedCitation.title}</h4>
              <button onClick={() => setSelectedCitation(null)} className="p-1 text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-[0.85rem] text-muted">
              {selectedCitation.sectionOrPage && (
                <p className="font-medium text-ink">{selectedCitation.sectionOrPage}</p>
              )}
              {selectedCitation.snippet && (
                <div className="rounded-xl border border-line bg-bg p-3 font-mono text-[0.8rem] text-ink/90">
                  {selectedCitation.snippet}
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedCitation(null)}
                className="rounded-full bg-ink px-4 py-2 text-[0.8rem] font-medium text-surface"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
