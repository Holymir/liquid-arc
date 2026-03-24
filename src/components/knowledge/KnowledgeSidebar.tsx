"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTopicBySlug } from "@/data/knowledge";

interface KnowledgeSidebarProps {
  topicSlug: string;
}

export function KnowledgeSidebar({ topicSlug }: KnowledgeSidebarProps) {
  const pathname = usePathname();
  const topic = getTopicBySlug(topicSlug);

  if (!topic) return null;

  return (
    <div className="space-y-5">
      {topic.categories.map((category) => (
        <div key={category.label}>
          {/* Category header */}
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-medium mb-2 px-3">
            {category.label}
          </p>

          {/* Subtopic links */}
          <div className="space-y-0.5">
            {category.subtopics.map((subtopic) => {
              const href = `/knowledge/${topicSlug}/${subtopic.slug}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={subtopic.slug}
                  href={href}
                  className={`block px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-arc-500/10 text-arc-400 border border-arc-500/25"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 border border-transparent"
                  }`}
                >
                  {subtopic.title}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
