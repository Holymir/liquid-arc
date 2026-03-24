"use client";

import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { KnowledgeSidebar } from "@/components/knowledge/KnowledgeSidebar";
import { ArticleLayout } from "@/components/knowledge/ArticleLayout";
import { findSubtopic } from "@/data/knowledge";

export default function SubtopicPage() {
  const params = useParams<{ topic: string; subtopic: string }>();
  const result = findSubtopic(params.topic, params.subtopic);

  if (!result) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-lg font-semibold text-on-surface mb-2">
              Topic not found
            </p>
            <p className="text-sm text-[#94a3b8]">
              The article you&rsquo;re looking for doesn&rsquo;t exist.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { topic, category, subtopic } = result;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-20">
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* Inline sidebar — hidden on mobile, shown on lg */}
          <aside className="hidden lg:block col-span-3">
            <div className="sticky top-24">
              <KnowledgeSidebar topicSlug={params.topic} />
            </div>
          </aside>

          {/* Article content */}
          <div className="col-span-12 lg:col-span-9">
            <ArticleLayout
              topic={topic}
              subtopic={subtopic}
              categoryLabel={category.label}
            >
              {subtopic.content()}
            </ArticleLayout>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
