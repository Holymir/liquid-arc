import { defiTopic } from "./defi";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface KnowledgeSubtopic {
  slug: string;
  title: string;
  summary: string;
  content: () => React.ReactNode;
}

export interface KnowledgeCategory {
  label: string;
  subtopics: KnowledgeSubtopic[];
}

export interface KnowledgeTopic {
  slug: string;
  title: string;
  description: string;
  categories: KnowledgeCategory[];
}

// ─────────────────────────────────────────
// Data
// ─────────────────────────────────────────

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [defiTopic];

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

export function getTopicBySlug(slug: string): KnowledgeTopic | undefined {
  return KNOWLEDGE_TOPICS.find((t) => t.slug === slug);
}

export function findSubtopic(
  topicSlug: string,
  subtopicSlug: string,
): { topic: KnowledgeTopic; category: KnowledgeCategory; subtopic: KnowledgeSubtopic } | undefined {
  const topic = getTopicBySlug(topicSlug);
  if (!topic) return undefined;
  for (const category of topic.categories) {
    const subtopic = category.subtopics.find((s) => s.slug === subtopicSlug);
    if (subtopic) return { topic, category, subtopic };
  }
  return undefined;
}

/** Flat ordered list of all subtopics for a topic */
export function flatSubtopics(topic: KnowledgeTopic): KnowledgeSubtopic[] {
  return topic.categories.flatMap((c) => c.subtopics);
}
