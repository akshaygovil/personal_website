// app/not-found.tsx
import Link from "next/link";
import { ThemeToggle } from "./components/themeToggle";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100svh",
        background: "var(--bg)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Theme toggle (top-right, subtle) */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
        }}
      >
        <ThemeToggle />
      </div>

      {/* Centered content */}
      <div
        className="container"
        style={{
          maxWidth: 520,
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "var(--muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          404
        </p>

        <h1
          style={{
            margin: "14px 0 0",
            fontSize: "clamp(32px, 4vw, 44px)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--text)",
          }}
        >
          You’ve reached a page that hasn’t been built.
        </h1>

        <p
          style={{
            marginTop: 16,
            fontSize: 17,
            color: "var(--text-2)",
          }}
        >
          Yet.
          <br />
          This site is improving day by day.
        </p>

        <div
          style={{
            marginTop: 30,
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            className="btn btnPrimary"
          >
            Return home
          </Link>

          <Link
            href=".."
            className="btn"
          >
            Go back
          </Link>
        </div>
      </div>
    </main>
  );
}
