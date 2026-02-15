"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "../components/themeToggle";
import type { PhotoEntry } from "../lib/photography";

type PhotoMeta = {
  aspectRatio: number;
  span: number;
};

export default function GalleryClient({photography}: {photography: PhotoEntry[]}) {
  const [meta, setMeta] = useState<Record<string, PhotoMeta>>({});
  const [active, setActive] = useState<string | null>(null);

  const activePhoto = photography.find((p) => p.id === active);

  useEffect(() => {
    if (!active) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);  

  return (
    <main
      id="content"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ---------------- Header ---------------- */}
      <header className="pageHeader">
        <div className="container">
          <div className="sectionContent pageHeaderInner">
            <Link href="/" className="pageHeaderBack">
              ← Back home
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ---------------- Gallery ---------------- */}
      <section className="section">
        <div className="container">
          <div className="sectionContent">
            <div className="blockGapXl">
              <h1 className="h1">Photography</h1>
              <p className="p-lg blockGap">
                On my travels I take photos to capture the moment. Here are some below. 
              </p>
            </div>

            <div className="galleryGrid blockGapXl">
              {photography.map((photo) => {
                const data = meta[photo.id];

                return (
                  <figure
                    key={photo.id}
                    className="galleryItem"
                    style={{
                      gridColumn: data ? `span ${data.span}` : "span 3",
                    }}
                    onClick={() => setActive(photo.id)}
                  >
                    <div
                      className="galleryItemImgWrap"
                      style={{
                        aspectRatio: data?.aspectRatio ?? "4 / 3",
                      }}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 900px) 100vw, 25vw"
                        className="galleryItemImg"
                        onLoadingComplete={(img) => {
                          const w = img.naturalWidth;
                          const h = img.naturalHeight;
                          const ratio = w / h;

                          let span = 3; // 4 per row default
                          if (ratio > 1.35) span = 6; // landscape
                          if (ratio < 0.75) span = 3; // portrait stays compact

                          setMeta((prev) =>
                            prev[photo.id]
                              ? prev
                              : {
                                  ...prev,
                                  [photo.id]: {
                                    aspectRatio: ratio,
                                    span,
                                  },
                                }
                          );
                        }}
                      />
                    </div>

                    {photo.caption && (
                      <figcaption className="galleryItemCaption">
                        {photo.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Lightbox ---------------- */}
      {activePhoto && (
        <div className="lightbox" onClick={(e) => (console.log('hello'), e.stopPropagation(), setActive(null))}>
          <div
            className="lightboxInner"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="lightboxClose"
              aria-label="Close image"
              onClick={() => setActive(null)}
            >
              ×
            </button>

            <Image
              src={activePhoto.src}
              alt={activePhoto.alt}
              fill
              sizes="100vw"
              className="lightboxImg"
            />

            {activePhoto.caption && (
              <p className="lightboxCaption">
                {activePhoto.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
