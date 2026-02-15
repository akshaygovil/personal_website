"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllWisdom } from "../lib/wisdom";
import { parseFormattedText } from "../lib/formatText";

export function DailyWisdom() {
  const allWisdom = getAllWisdom();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % allWisdom.length);
      setIsTransitioning(false);
    }, 150);
  }, [isTransitioning, allWisdom.length]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(
        (prev) => (prev - 1 + allWisdom.length) % allWisdom.length
      );
      setIsTransitioning(false);
    }, 150);
  }, [isTransitioning, allWisdom.length]);

  const goToIndex = useCallback(
    (index: number) => {
      if (isTransitioning || index === currentIndex) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 150);
    },
    [isTransitioning, currentIndex]
  );

  // Set initial index based on day of year
  useEffect(() => {
    if (!allWisdom.length) return;

    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    setCurrentIndex(dayOfYear % allWisdom.length);
  }, [allWisdom.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isTransitioning, goToPrev, goToNext]);

  const currentWisdom = allWisdom[currentIndex];
  if (!currentWisdom) return null;

  return (
    <section className="section sectionHalo" id="wisdom">
      <div className="container">
        <div className="sectionContent">
          <div className="featureCard">
            {/* --------------------------------
               Header
            -------------------------------- */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--block-gap-lg)",
              }}
            >
              <span className="sectionLabel" style={{ margin: 0 }}>
                Daily Wisdom
              </span>

              <a
                href="/wisdom"
                style={{
                  fontSize: 13,
                  color: "var(--accent)",
                  textDecoration: "none",
                }}
              >
                View all →
              </a>
            </div>

            {/* --------------------------------
               Content
            -------------------------------- */}
            <div style={{ position: "relative", minHeight: 160 }}>
              <div
                style={{
                  opacity: isTransitioning ? 0 : 1,
                  transition: "opacity 300ms ease",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
                    lineHeight: 1.8,
                    color: "var(--text)",
                  }}
                >
                  {parseFormattedText(currentWisdom.content)}
                </p>

                <div
                  className="blockGap"
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                  }}
                >
                  <time dateTime={currentWisdom.date}>
                    {new Date(currentWisdom.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </div>
            </div>

            {/* --------------------------------
               Navigation
            -------------------------------- */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "var(--block-gap-lg)",
                paddingTop: "var(--block-gap)",
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                onClick={goToPrev}
                disabled={isTransitioning}
                className="btn iconBtn"
                aria-label="Previous wisdom"
              >
                ← Prev
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                {allWisdom.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToIndex(index)}
                    disabled={isTransitioning}
                    aria-label={`Go to wisdom ${index + 1}`}
                    style={{
                      width: index === currentIndex ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      border: "none",
                      background:
                        index === currentIndex
                          ? "var(--accent)"
                          : "var(--border)",
                      transition: "all var(--transition)",
                      cursor:
                        index === currentIndex ? "default" : "pointer",
                      padding: 0,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={goToNext}
                disabled={isTransitioning}
                className="btn iconBtn"
                aria-label="Next wisdom"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
