// src/app/lib/photography.ts
import "server-only";

import fs from "fs";
import path from "path";

export type PhotoOrientation = "landscape" | "portrait";

export type PhotoEntry = {
  id: string;
  src: string;
  alt: string;
  orientation?: PhotoOrientation;
  caption?: string;
};

const PHOTOGRAPHY_DIR = path.join(
  process.cwd(),
  "public",
  "photography"
);

export const photography: PhotoEntry[] = fs
  .readdirSync(PHOTOGRAPHY_DIR)
  .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
  .sort()
  .map((file, index) => ({
    id: String(index + 1),
    src: `/photography/${file}`,
    alt: file.replace(/\.[^/.]+$/, ""),
  }));

const HOME_FEATURED = [
  "20260206_200751.jpg",
  "20260129_190726.jpg",
  "20260121_064026.jpg",
  "20260109_190240.jpg",
];

export function getPreviewPhotos(): PhotoEntry[] {
  return HOME_FEATURED
    .map((name) =>
      photography.find((p) => p.src === `/photography/${name}`)
    )
    .filter(Boolean) as PhotoEntry[];
}
