"use client"

import { getAllWisdom } from "../lib/wisdom";
import { parseFormattedText } from "../lib/formatText";
import Footer from "../components/Footer";
import { ThemeToggle } from "../components/themeToggle";

export default function WisdomPage() {
  const allWisdom = getAllWisdom();

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header with theme toggle */}
      <header
        style={{
          padding: "var(--section-padding-y) 0",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <a
              href="/"
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text)",
                textDecoration: "none",
                transition: "color var(--transition)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text)"}
            >
              ← Back home
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="section">
        <div className="container">
          <div className="sectionContent">
            <div className="blockGapXl">
              <h1 className="h1">Daily Wisdom</h1>
              <p className="p-lg blockGap">
                Reflections on building, learning, and living intentionally.
              </p>
            </div>

            <div style={{ display: "grid", gap: "var(--block-gap-lg)" }}>
              {allWisdom.map((wisdom) => (
                <article
                  key={wisdom.id}
                  className="featureCard"
                  style={{
                    transition: "transform var(--transition-slow), box-shadow var(--transition-slow)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow)";
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
                    {parseFormattedText(wisdom.content)}
                  </p>

                  <div
                    className="blockGap"
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <time dateTime={wisdom.date}>
                      {new Date(wisdom.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
