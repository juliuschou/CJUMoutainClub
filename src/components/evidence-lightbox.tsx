"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { LightboxPhoto } from "@/lib/types";

type EvidenceLightboxProps = {
  evidence: LightboxPhoto[];
  currentIndex: number;
  onChange: (index: number) => void;
  onClose: () => void;
};

export function EvidenceLightbox({ evidence, currentIndex, onChange, onClose }: EvidenceLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const current = evidence[currentIndex];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    closeButtonRef.current?.focus();
    return () => {
      if (dialog.open && typeof dialog.close === "function") dialog.close();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && currentIndex > 0) onChange(currentIndex - 1);
      if (event.key === "ArrowRight" && currentIndex < evidence.length - 1) onChange(currentIndex + 1);
      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>(".lightbox[open]");
        if (!dialog) return;
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIndex, evidence.length, onChange, onClose]);

  if (!current) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${current.altText}，照片檢視器`}
      aria-modal="true"
      className="lightbox"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="lightbox__panel">
        <div className="lightbox__toolbar">
          <p aria-live="polite">第 {currentIndex + 1} 張，共 {evidence.length} 張</p>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="關閉照片檢視器">
            關閉 ×
          </button>
        </div>
        <div className="lightbox__image-stage">
          <Image
            alt={current.altText}
            className="lightbox__image"
            height={current.height}
            priority
            sizes="100vw"
            src={current.fullImageUrl}
            width={current.width}
          />
        </div>
        <div className="lightbox__footer">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => onChange(currentIndex - 1)}
          >
            ← 上一張
          </button>
          <div>
            <strong>{current.sourceFileName}</strong>
            {current.contextParagraph ? <p>{current.contextParagraph}</p> : null}
          </div>
          <button
            type="button"
            disabled={currentIndex === evidence.length - 1}
            onClick={() => onChange(currentIndex + 1)}
          >
            下一張 →
          </button>
        </div>
      </div>
    </dialog>
  );
}
