import manifestData from "@/generated/manifest.json";
import type { BuildManifest } from "@/lib/types";

export const manifest = manifestData as BuildManifest;
