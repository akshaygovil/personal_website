// components/HighSchoolSection.tsx
import Image from "next/image";

export default function HighSchoolSection() {
  return (
    <section className="section" id="high-school">
      <div className="container">
        <div className="sectionContent">
          <div className="featureCard">
            <div className="featureGrid">
              {/* Content */}
              <div className="featureLeft">
                <h2 className="h2">High School</h2>
                <p className="p-lg blockGap">
                  Before university, startups, and software, my focus was on building
                  a strong academic foundation — particularly in mathematics.
                </p>
                <ul className="bullets blockGapLg" style={{ maxWidth: "400px" }}>
                  <li style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Mathematics Extension 1</span>
                    <span style={{ fontWeight: 500, color: "var(--text)" }}>98</span>
                  </li>
                  <li style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Mathematics Extension 2</span>
                    <span style={{ fontWeight: 500, color: "var(--text)" }}>98</span>
                  </li>
                  <li style={{ display: "flex", justifyContent: "space-between", paddingTop: "var(--block-gap-lg)", marginTop: "var(--block-gap-lg)", borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>ATAR</span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>99.4</span>
                  </li>
                </ul>
                <p className="p blockGapLg">
                  This period shaped how I think — disciplined problem solving,
                  comfort with complexity, and the ability to stay consistent over
                  long horizons.
                </p>
              </div>
              {/* Image */}
              <div className="featureRight">
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "320px",
                    aspectRatio: "4 / 5",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <Image
                    src="/hs.png"
                    alt="High school portrait"
                    fill
                    style={{ objectFit: "cover" }}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
