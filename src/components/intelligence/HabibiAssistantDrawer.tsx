"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Sparkles, ShieldCheck, Trash2, ArrowUpRight } from "lucide-react";
import { useIntelligence } from "./IntelligenceProvider";
import { campaignBySlug } from "@/lib/web3/campaigns";
import type { Citation } from "@/lib/intelligence/types";

const HABIBI_MASCOT_SRC = "/logo.png";

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

  // Auto-scroll chat conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Accessibility: Escape key down to close assistant panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeAssistant();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeAssistant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <>
      {/* Floating Action Button (Launcher) */}
      <div className="fixed bottom-6 right-6 z-[90] flex items-center gap-3">
        {/* Desktop Hover Tooltip */}
        <div className="pointer-events-none hidden opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 sm:block">
          <div className="rounded-full bg-ink px-4 py-2 text-[0.8rem] font-medium text-surface shadow-lg border border-white/10">
            Habibi Intelligence
          </div>
        </div>

        <button
          onClick={() => (isOpen ? closeAssistant() : openAssistant())}
          aria-label="Open Habibi Intelligence"
          aria-expanded={isOpen}
          className="focus-lime intelligence-launcher-glow relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full border border-lime/30 bg-ink transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.04] group"
        >
          {/* Mascot Image centered (cropped to head area using scale-[1.5]) */}
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 overflow-hidden rounded-full border border-[#fcfaf5]/20 ring-1 ring-lime/30">
            <Image
              src={HABIBI_MASCOT_SRC}
              alt="Habibi Mascot"
              fill
              sizes="72px"
              priority
              className="scale-[1.5] object-cover object-center"
            />
          </div>

          {/* Lime Pulse Indicator */}
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-[3px] border-ink bg-lime" />
          </span>
        </button>
      </div>

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
              className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs"
            />

            {/* Desktop Panel / Mobile Sheet */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 210 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l border-lime/20 bg-[#0b0c09] shadow-[0_0_60px_-15px_rgba(200,255,24,0.18)] sm:max-w-[460px] text-[#fcfaf5]"
            >
              {/* Internal ambient radial glow */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(200,255,24,0.05),transparent_60%)]" />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-[#10110f] px-5 py-4">
                <div className="flex items-center gap-3">
                  {/* Mascot Avatar */}
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#fcfaf5]/20 ring-1 ring-lime/30">
                    <Image
                      src={HABIBI_MASCOT_SRC}
                      alt="Habibi AI Mascot"
                      fill
                      sizes="64px"
                      className="scale-[1.5] object-cover object-center"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-[#fcfaf5]">Habibi Intelligence</h3>
                    <p className="flex items-center gap-1.5 text-[0.72rem] font-medium text-[#9a978d]">
                      <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                      {activeCampaign ? `Analyzing: ${activeCampaign.name}` : "Real Estate Copilot · Online"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={clearHistory}
                    title="Clear Conversation"
                    className="rounded-full p-2 text-[#9a978d] hover:bg-white/5 hover:text-[#fcfaf5] transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={closeAssistant}
                    aria-label="Close Habibi Intelligence"
                    className="rounded-full p-2 text-[#fcfaf5] hover:bg-white/5 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Portfolio Consent Banner */}
              <div className="relative z-10 border-b border-white/5 bg-[#151612]/60 px-5 py-2.5 text-[0.75rem] text-[#9a978d] flex items-center justify-between">
                <span>Personalize using portfolio data?</span>
                <button
                  onClick={() => setHasPortfolioConsent(!hasPortfolioConsent)}
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${
                    hasPortfolioConsent ? "bg-lime text-ink" : "bg-white/10 text-[#fcfaf5]"
                  }`}
                >
                  {hasPortfolioConsent ? "Consent Active" : "Allow Consent"}
                </button>
              </div>

              {/* Chat Conversation Scroll Area */}
              <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-5 py-5 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-[0.88rem] leading-relaxed shadow-sm ${
                        msg.sender === "user"
                          ? "bg-lime text-ink rounded-br-none font-medium"
                          : "bg-[#151612] border border-white/10 text-[#fcfaf5] rounded-bl-none"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 border-t border-white/10 pt-2.5">
                          <p className="text-[0.68rem] uppercase tracking-wider text-[#9a978d] font-bold mb-1.5">
                            Verified Sources
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => setSelectedCitation(c)}
                                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#10110f] px-2.5 py-1 text-[0.68rem] font-medium text-[#fcfaf5] hover:border-lime hover:bg-lime/10 transition-colors"
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
                      <div className="mt-3 flex flex-wrap gap-1.5 max-w-[90%]">
                        {msg.suggestedPrompts.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(prompt)}
                            className="rounded-xl border border-white/5 bg-[#151612]/60 px-3 py-2 text-[0.76rem] font-medium text-[#fcfaf5]/85 hover:border-lime hover:text-surface transition-all duration-200 text-left hover:-translate-y-0.5"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="mt-1 text-[0.68rem] text-[#9a978d]/60">{msg.timestamp}</span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-[0.8rem] font-medium text-[#9a978d]">
                    <Sparkles className="h-4 w-4 animate-spin text-lime" />
                    <span>Habibi Intelligence is analyzing data…</span>
                  </div>
                )}
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSubmit} className="relative z-10 border-t border-white/10 bg-[#10110f] p-4">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0c09] px-3.5 py-2.5 focus-within:border-lime/40 transition-colors">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about properties, risks, documents…"
                    className="w-full bg-transparent text-[0.88rem] text-[#fcfaf5] outline-none placeholder:text-[#9a978d]/50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="rounded-lg bg-lime p-2 text-ink hover:scale-105 active:scale-100 transition-transform disabled:opacity-40"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[0.68rem] text-[#9a978d]">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-lime" /> Read-only AI Assistant
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#10110f] p-6 shadow-2xl text-[#fcfaf5]">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <h4 className="font-serif text-lg text-[#fcfaf5]">{selectedCitation.title}</h4>
              <button onClick={() => setSelectedCitation(null)} className="p-1 text-[#9a978d] hover:text-[#fcfaf5]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-[0.85rem] text-[#9a978d]">
              {selectedCitation.sectionOrPage && (
                <p className="font-medium text-[#fcfaf5]">{selectedCitation.sectionOrPage}</p>
              )}
              {selectedCitation.snippet && (
                <div className="rounded-xl border border-white/15 bg-black/40 p-4 font-mono text-[0.8rem] text-[#fcfaf5]/90 leading-relaxed max-h-60 overflow-y-auto">
                  {selectedCitation.snippet}
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedCitation(null)}
                className="rounded-full bg-lime px-5 py-2 text-[0.8rem] font-medium text-ink transition-transform hover:scale-105"
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
