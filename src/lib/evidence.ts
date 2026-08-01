import type { Evidence, LightboxPhoto } from "@/lib/types";

export function isPhotoEvidence(evidence: Evidence) {
  return !evidence.decorative;
}

export function toLightboxPhotos(evidence: Evidence[]): LightboxPhoto[] {
  return evidence.filter(isPhotoEvidence).map((item) => ({
    evidenceId: item.evidenceId,
    sourceFileName: item.sourceFileName,
    fullImageUrl: item.fullImageUrl,
    width: item.width,
    height: item.height,
    altText: item.altText,
    contextParagraph: item.contextParagraph,
  }));
}
