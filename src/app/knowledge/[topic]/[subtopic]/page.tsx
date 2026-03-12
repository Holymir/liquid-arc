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
            <p className="text-lg font-semibold text-slate-300 mb-2">
              Topic not found
            </p>
            <p className="text-sm text-slate-500">
              The article you&rsquo;re looking for doesn&rsquo;t exist.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { topic, category, subtopic } = result;

  return (
    <AppLayout
      sidebarTitle="Knowledge"
      sidebarSlot={<KnowledgeSidebar topicSlug={topic.slug} />}
    >
      <ArticleLayout
        topic={topic}
        subtopic={subtopic}
        categoryLabel={category.label}
      >
        {subtopic.content()}
      </ArticleLayout>
    </AppLayout>
  );
}
