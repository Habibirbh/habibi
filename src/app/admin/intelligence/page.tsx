"use client";

import React, { useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/sections/Footer";
import { Upload } from "lucide-react";
import { initialDocumentChunks } from "@/lib/intelligence/ragPipeline";

export default function AdminIntelligencePage() {
  const [chunks] = useState(initialDocumentChunks);

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-bg py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-lime/20 px-3 py-1 text-[0.7rem] font-medium text-ink">
              Admin Governance & Intelligence
            </span>
          </div>
          <h1 className="mt-3 font-serif text-4xl text-ink">Admin Intelligence Dashboard</h1>
          <p className="mt-2 text-base text-muted max-w-2xl">
            Manage AI document ingestion, review extracted RAG chunks, configure scoring weights, and approve public reports.
          </p>

          {/* Quick Actions Bar */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <span className="text-[0.68rem] uppercase tracking-wider text-muted font-medium block">
                Indexed Documents
              </span>
              <span className="font-serif text-3xl font-bold text-ink mt-1 block">{chunks.length}</span>
              <span className="text-[0.75rem] text-muted">Public RAG Chunks Active</span>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <span className="text-[0.68rem] uppercase tracking-wider text-muted font-medium block">
                Scoring Model Status
              </span>
              <span className="font-serif text-2xl font-bold text-ink mt-1 block">v1.0.0</span>
              <span className="text-[0.75rem] text-muted">Deterministic 9-Category Model</span>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <span className="text-[0.68rem] uppercase tracking-wider text-muted font-medium block">
                Report Approval State
              </span>
              <span className="font-serif text-2xl font-bold text-ink mt-1 block">2 / 2 Approved</span>
              <span className="text-[0.75rem] text-muted">Palmiera 2 & ELO Active</span>
            </div>
          </div>

          {/* Document Ingestion & RAG Inspection */}
          <div className="mt-10 rounded-3xl border border-line bg-surface p-6 shadow-card">
            <h3 className="font-serif text-xl text-ink border-b border-line pb-3 flex items-center justify-between">
              <span>Indexed Property Documents (RAG Ingestion)</span>
              <button className="focus-lime inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[0.78rem] font-medium text-surface hover:bg-lime hover:text-ink transition-colors">
                <Upload className="h-3.5 w-3.5" /> Ingest Approved Document
              </button>
            </h3>

            <div className="mt-4 space-y-3">
              {chunks.map((chunk) => (
                <div key={chunk.chunkId} className="rounded-2xl border border-line bg-bg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-lg font-bold text-ink">{chunk.title}</span>
                    <span className="rounded-full bg-lime/20 px-2.5 py-0.5 text-[0.7rem] font-medium text-ink">
                      {chunk.propertySlug}
                    </span>
                  </div>
                  <p className="text-[0.82rem] text-muted font-mono bg-surface p-3 rounded-xl border border-line">
                    {chunk.content}
                  </p>
                  <div className="flex items-center justify-between text-[0.72rem] text-muted">
                    <span>Section: {chunk.sectionTitle}</span>
                    <span>Access: {chunk.accessLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
