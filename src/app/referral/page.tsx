"use client";

import { useState, useMemo } from "react";

/* -------------------------
   Types
-------------------------- */
type Broker = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  location: string;
  specialties: string[];
  formUrl: string;
};

/* -------------------------
   Mock Data — replace with your real data source
-------------------------- */
const BROKERS: Broker[] = [
  {
    id: "1",
    name: "Demo",
    slug: "hartley-finance",
    tagline: "A sample demo",
    location: "Sydney, NSW",
    specialties: [],
    formUrl: "/referral/demo",
  },
  {
    id: "2",
    name: "Meridian Home Loans",
    slug: "meridian-home-loans",
    tagline: "Competitive rates and fast approvals for owner-occupiers and investors.",
    location: "Melbourne, VIC",
    specialties: ["Owner-Occupier", "Self-Employed", "Low Doc"],
    formUrl: "/brokers/meridian-home-loans",
  },
  {
    id: "3",
    name: "Crestview Lending",
    slug: "crestview-lending",
    tagline: "Tailored mortgage solutions for high-value residential and commercial property.",
    location: "Brisbane, QLD",
    specialties: ["Luxury Residential", "Commercial", "Construction Loans"],
    formUrl: "/brokers/crestview-lending",
  },
  {
    id: "4",
    name: "Beacon Mortgage Advisory",
    slug: "beacon-mortgage",
    tagline: "Independent advice with access to 40+ lenders to find your best fit.",
    location: "Perth, WA",
    specialties: ["Independent Advice", "Refinancing", "Debt Consolidation"],
    formUrl: "/brokers/beacon-mortgage",
  },
  {
    id: "5",
    name: "Summit Home Finance",
    slug: "summit-home-finance",
    tagline: "Streamlined digital lending process — pre-approval in as little as 24 hours.",
    location: "Adelaide, SA",
    specialties: ["Fast Pre-Approval", "First Home Buyers", "PAYG"],
    formUrl: "/brokers/summit-home-finance",
  },
  {
    id: "6",
    name: "Pinnacle Mortgage Partners",
    slug: "pinnacle-mortgage",
    tagline: "Strategic lending for property investors growing their portfolio.",
    location: "Gold Coast, QLD",
    specialties: ["Property Investment", "Portfolio Lending", "Interest Only"],
    formUrl: "/brokers/pinnacle-mortgage",
  },
];

const ALL_SPECIALTIES = Array.from(
  new Set(BROKERS.flatMap((b) => b.specialties))
).sort();

/* -------------------------
   Sub-components
-------------------------- */
function BrokerCard({ broker }: { broker: Broker }) {
  return (
    <a
      href={broker.formUrl}
      className="featureCard brokerCard"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        textDecoration: "none",
        cursor: "pointer",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <p className="p" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.45, marginBottom: 4 }}>
            {broker.location}
          </p>
          <h3 className="h3" style={{ fontSize: "1.05rem", lineHeight: 1.3 }}>
            {broker.name}
          </h3>
        </div>
        <span
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1.5px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.4,
            fontSize: 13,
          }}
        >
          ↗
        </span>
      </div>

      {/* Tagline */}
      <p className="p" style={{ opacity: 0.6, lineHeight: 1.6, fontSize: "0.9rem", flexGrow: 1 }}>
        {broker.tagline}
      </p>

      {/* Specialties */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {broker.specialties.map((s) => (
          <span
            key={s}
            className="sectionLabel"
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 4,
              background: "var(--surface-2, rgba(128,128,128,0.08))",
              letterSpacing: "0.06em",
              fontWeight: 500,
              textTransform: "none",
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </a>
  );
}

/* -------------------------
   Page Component
-------------------------- */
export default function HomePage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return BROKERS.filter((b) => {
      const matchesQuery =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.tagline.toLowerCase().includes(q) ||
        b.specialties.some((s) => s.toLowerCase().includes(q));
      const matchesFilter =
        !activeFilter || b.specialties.includes(activeFilter);
      return matchesQuery && matchesFilter;
    });
  }, [query, activeFilter]);

  return (
    <main>
      {/* ── Hero / Search ───────────────────────────────── */}
      <section className="section sectionHalo">
        <div
          className="container"
          style={{
            minHeight: "calc(50svh - 96px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            textAlign: "center",
            paddingTop: 72,
            paddingBottom: 48,
          }}
        >
          <div className="blockStack" style={{ alignItems: "center" }}>
            <span className="sectionLabel">Broker Network</span>
            <h1 className="h1" style={{ maxWidth: 560 }}>
              Find the right mortgage broker
            </h1>
            <p className="p-lg" style={{ maxWidth: 560, opacity: 0.6 }}>
              Browse our network of trusted lending specialists. Select a broker
              to submit a referral on behalf of your client.
            </p>
          </div>

          {/* Search bar */}
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.35,
                fontSize: 15,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              ⌕
            </span>
            <input
              className="input"
              placeholder="Search by name, location or specialty…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: 38, width: "100%", boxSizing: "border-box" }}
            />
          </div>
        </div>
      </section>

      {/* ── Filter Pills ───────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--border)", background: "var(--surface, var(--bg))" }}>
        <div
          className="container"
          style={{
            paddingTop: 12,
            paddingBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          <button
            className={`btn ${!activeFilter ? "btnPrimary" : ""}`}
            style={{
              flexShrink: 0,
              padding: "5px 14px",
              fontSize: "0.78rem",
              borderRadius: 20,
              fontWeight: 500,
              ...(activeFilter
                ? { background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }
                : {}),
            }}
            onClick={() => setActiveFilter(null)}
          >
            All
          </button>
          {ALL_SPECIALTIES.map((s) => (
            <button
              key={s}
              className={`btn ${activeFilter === s ? "btnPrimary" : ""}`}
              style={{
                flexShrink: 0,
                padding: "5px 14px",
                fontSize: "0.78rem",
                borderRadius: 20,
                fontWeight: 500,
                ...(activeFilter !== s
                  ? { background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }
                  : {}),
              }}
              onClick={() => setActiveFilter(activeFilter === s ? null : s)}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* ── Broker Grid ────────────────────────────────── */}
      <section className="section">
        <div className="container">
          {/* Count */}
          <p
            className="p"
            style={{ opacity: 0.4, fontSize: "0.8rem", marginBottom: 24, letterSpacing: "0.05em" }}
          >
            {filtered.length === BROKERS.length
              ? `${BROKERS.length} brokers`
              : `${filtered.length} of ${BROKERS.length} brokers`}
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 16,
              }}
            >
              {filtered.map((broker) => (
                <BrokerCard key={broker.id} broker={broker} />
              ))}
            </div>
          ) : (
            <div
              className="featureCard"
              style={{ textAlign: "center", padding: "56px 32px" }}
            >
              <p className="p-lg" style={{ opacity: 0.4 }}>
                No brokers match your search.
              </p>
              <button
                className="btn"
                style={{ marginTop: 16 }}
                onClick={() => {
                  setQuery("");
                  setActiveFilter(null);
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "32px 0",
          marginTop: 40,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p className="p" style={{ opacity: 0.35, fontSize: "0.78rem" }}>
            © {new Date().getFullYear()} Broker Network. Internal use only.
          </p>
          <p className="p" style={{ opacity: 0.35, fontSize: "0.78rem" }}>
            {BROKERS.length} active brokers
          </p>
        </div>
      </footer>
    </main>
  );
}