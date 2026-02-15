// components/AureusShowcase.tsx

type AureusShowcaseProps = {
  physiqueImage?: string;
  screenshots?: [string, string, string];
};

export function AureusShowcase({
  physiqueImage = "/physique.jpg",
  screenshots = [
    "/1.png",
    "/2.png",
    "/3.png",
  ],
}: AureusShowcaseProps) {
  return (
    <section className="section sectionHalo" id="aureus">
      <div className="container">
        <div className="sectionContent">
          <div className="featureCard">
            {/* --------------------------------
               Header
            -------------------------------- */}
            <div style={{ display: "grid", gap: "var(--block-gap)" }}>
              <span className="sectionLabel">Aureus</span>

              <h2 className="h2">
                Built from real training,
                <br />
                not assumptions.
              </h2>

              <p className="p-lg">
                Aureus is an AI-powered training system for lifters who care about
                progression — because it was built by one.
              </p>
            </div>

            {/* --------------------------------
               Physique proof
            -------------------------------- */}
            <div
              className="blockGapLg"
              style={{ display: "grid", gap: "var(--block-gap)" }}
            >
              <ImageCard>
                <img
                  src={physiqueImage}
                  alt="Experienced lifter physique"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </ImageCard>

              <p className="p-sm">
                Years of structured hypertrophy and strength training informed
                every design decision.
              </p>
            </div>

            {/* --------------------------------
               Philosophy
            -------------------------------- */}
            <div
              className="blockGapXl"
              style={{ display: "grid", gap: "var(--block-gap)" }}
            >
              <p className="p-lg">
                Most fitness apps are built to log workouts.
              </p>

              <p className="p">
                Aureus was built to understand them.
              </p>

              <p className="p">
                Volume, load, sets, reps, rest, fatigue, and progression —
                captured over time and interpreted the way experienced lifters
                already think.
              </p>
            </div>

            {/* --------------------------------
               Screenshots (horizontal row)
            -------------------------------- */}
<div
  className="blockGapXl"
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--block-gap)",
    width: "100%",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      gap: "clamp(16px, 4vw, 48px)", // scales nicely
      width: "100%",
    }}
  >
    <Screenshot
      image={screenshots[0]}
      title="Training clarity"
      description="Sessions broken down into what actually matters."
    />

    <Screenshot
      image={screenshots[1]}
      title="Progression over time"
      description="Patterns emerge automatically as data compounds."
    />

    <Screenshot
      image={screenshots[2]}
      title="Intelligent feedback"
      description="Stagnation, overload, and recovery signals surfaced."
    />
  </div>

  <p
    className="p-sm"
    style={{
      maxWidth: 560,
      textAlign: "center",
    }}
  >
    A calm, focused interface designed to stay out of the way during training —
    while still surfacing insight when it matters.
  </p>
</div>

            {/* --------------------------------
               Features
            -------------------------------- */}
            <div
              className="blockGapLg"
              style={{ display: "grid", gap: "var(--block-gap-lg)" }}
            >
              <Feature>
                Offline-first and instant — zero lag during training.
              </Feature>

              <Feature>
                Designed specifically for hypertrophy and strength.
              </Feature>

              <Feature>
                Intelligence layered on top of real training data.
              </Feature>
            </div>

            {/* --------------------------------
               CTA
            -------------------------------- */}
            <div
              className="blockGapXl"
              style={{
                display: "flex",
                gap: "var(--block-gap)",
                flexWrap: "wrap",
              }}
            >
              <a className="btn btnPrimary" href="#">
                Explore Aureus
              </a>

              <a className="btn" href="#">
                Read the philosophy
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------
   Helpers
-------------------------------- */

function ImageCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      {children}
    </div>
  );
}

function Screenshot({
  image,
  title,
  description,
  offset,
}: {
  image: string;
  title: string;
  description: string;
  offset?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        width: 260,
        marginTop: offset ? 24 : 0,
      }}
    >
      <ImageCard>
        <img
          src={image}
          alt={title}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </ImageCard>

      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ fontSize: 13 }}>{title}</strong>
        <p className="p-sm">{description}</p>
      </div>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        paddingLeft: 14,
        borderLeft: "2px solid var(--accent)",
        fontSize: 15,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}
