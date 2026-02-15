"use client";

import Link from "next/link";
import { ThemeToggle } from "./themeToggle";

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "auto",
        paddingTop: "var(--section-padding-y)",
        paddingBottom: "var(--section-padding-y)",
        borderTop: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      <div className="container">
        <div className="sectionContent">
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "var(--block-gap-xl)",
              flexWrap: "wrap",
            }}
          >
            {/* --------------------------------
               Left column
            -------------------------------- */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--block-gap)",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text)",
                  letterSpacing: "-0.01em",
                }}
              >
                Akshay Govil
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--block-gap)",
                  fontSize: 14,
                  color: "var(--text-2)",
                }}
              >
                <a
                  href="mailto:akshaygovil913@gmail.com"
                  style={{ transition: "color var(--transition)" }}
                >
                  akshaygovil913@gmail.com
                </a>

                <a
                  href="tel:+61400000000"
                  style={{ transition: "color var(--transition)" }}
                >
                  +61 400 000 000
                </a>

                <a
                  href="https://www.linkedin.com/in/akshayg0106/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ transition: "color var(--transition)" }}
                >
                  LinkedIn
                </a>

                <Link
                  href="/wisdom"
                  style={{ transition: "color var(--transition)" }}
                >
                  Daily Wisdom
                </Link>

                <Link
                  href="/photography"
                  style={{ transition: "color var(--transition)" }}
                >
                  Photography
                </Link>
              </div>
            </div>

            {/* --------------------------------
               Right column
            -------------------------------- */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "var(--block-gap)",
                marginLeft: "auto",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontWeight: 500,
                }}
              >
                Appearance
              </span>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
