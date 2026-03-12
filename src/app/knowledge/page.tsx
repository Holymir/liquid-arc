"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { KNOWLEDGE_TOPICS, flatSubtopics } from "@/data/knowledge";

export default function KnowledgePage() {
  const router = useRouter();

  useEffect(() => {
    const topic = KNOWLEDGE_TOPICS[0];
    const first = flatSubtopics(topic)[0];
    router.replace(`/knowledge/${topic.slug}/${first.slug}`);
  }, [router]);

  return null;
}
