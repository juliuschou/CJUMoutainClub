"use client";

import type { MouseEvent, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { EvidenceLightbox } from "@/components/evidence-lightbox";
import type { LightboxPhoto } from "@/lib/types";

type StoryInteractiveProps = {
  children: ReactNode;
  photos: LightboxPhoto[];
};

export function StoryInteractive({ children, photos }: StoryInteractiveProps) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setCurrentIndex(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  function onArticleClick(event: MouseEvent<HTMLElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>("button[data-evidence-index]");
    if (!button) return;
    const index = Number.parseInt(button.dataset.evidenceIndex ?? "", 10);
    if (!Number.isInteger(index) || !photos[index]) return;
    triggerRef.current = button;
    setCurrentIndex(index);
  }

  return (
    <>
      <article className="story-prose" onClick={onArticleClick}>{children}</article>
      {currentIndex === null ? null : (
        <EvidenceLightbox
          evidence={photos}
          currentIndex={currentIndex}
          onChange={setCurrentIndex}
          onClose={close}
        />
      )}
    </>
  );
}
