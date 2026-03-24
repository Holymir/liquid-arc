"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { KnowledgeTopic, KnowledgeSubtopic } from "@/data/knowledge";
import { flatSubtopics } from "@/data/knowledge";

interface ArticleLayoutProps {
  topic: KnowledgeTopic;
  subtopic: KnowledgeSubtopic;
  categoryLabel: string;
  children: React.ReactNode;
}

export function ArticleLayout({
  topic,
  subtopic,
  categoryLabel,
  children,
}: ArticleLayoutProps) {
  const all = flatSubtopics(topic);
  const idx = all.findIndex((s) => s.slug === subtopic.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <div className="max-w-3xl px-4 sm:px-6 lg:px-0 py-6 lg:py-10">
      {/* Breadcrumb */}
      <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-medium mb-2">
        <Link
          href="/knowledge"
          className="hover:text-on-surface transition-colors"
        >
          Knowledge
        </Link>
        {" / "}
        <Link
          href={`/knowledge/${topic.slug}/${all[0].slug}`}
          className="hover:text-on-surface transition-colors"
        >
          {topic.title}
        </Link>
        {" / "}
        <span className="text-[#94a3b8]">{categoryLabel}</span>
      </p>

      {/* Title */}
      <h1
        className="text-2xl sm:text-3xl font-bold text-on-surface mb-8"
        style={{ fontFamily: "var(--font-syne), sans-serif" }}
      >
        {subtopic.title}
      </h1>

      {/* Content */}
      <div className="prose-knowledge space-y-4">
        {children}
      </div>

      {/* Prev / Next */}
      <div
        className="mt-12 pt-6 flex items-center justify-between gap-4 border-t border-outline-variant/20"
      >
        {prev ? (
          <Link
            href={`/knowledge/${topic.slug}/${prev.slug}`}
            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-arc-400 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/knowledge/${topic.slug}/${next.slug}`}
            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-arc-400 transition-colors ml-auto"
          >
            {next.title}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
