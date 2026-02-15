// components/FeatureSplit.tsx
type FeatureSplitProps = {
  id?: string;
  title: string;
  description: string;
  bullets: string[];
  imageAlt?: string;
};

/**
 * Left text, right image (responsive: stacks on mobile).
 * Replace the .fakeImage div with <img ... /> when you have a real asset.
 */
export function FeatureSplit(props: FeatureSplitProps) {
  const { id, title, description, bullets, imageAlt } = props;

  return (
    <section className="section" id={id}>
      <div className="container">
        <div className="featureCard">
          <div className="featureGrid">
            <div className="featureLeft">
              <h2 className="h2">{title}</h2>
              <p className="p-lg" style={{ marginTop: 12 }}>
                {description}
              </p>

              <ul className="bullets">
                {bullets.map((b) => (
                  <li key={b}>
                    <span className="bulletDot" aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a className="btn btnPrimary" href="#contact">
                  Get in touch
                </a>
                <a className="btn" href="#work">
                  See case studies
                </a>
              </div>
            </div>

            <div className="featureRight">
              {/* Swap this with a real <img /> */}
              <div className="fakeImage" role="img" aria-label={imageAlt ?? "Feature preview"} />
              <div className="caption">
                Replace with a screenshot, product mock, or a high-quality photo.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
