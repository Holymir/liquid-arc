"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTopicBySlug, flatSubtopics } from "@/data/knowledge";

export default function TopicRedirectPage() {
  const router = useRouter();
  const params = useParams<{ topic: string }>();

  useEffect(() => {
    const topic = getTopicBySlug(params.topic);
    if (topic) {
      const first = flatSubtopics(topic)[0];
      router.replace(`/knowledge/${topic.slug}/${first.slug}`);
    } else {
      router.replace("/knowledge");
    }
  }, [params.topic, router]);

  return null;
}
