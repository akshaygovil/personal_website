import Link from "next/link";
import Image from "next/image";
import { getPreviewPhotos } from "../lib/photography";

export default function PhotographySection() {
  const previewPhotos = getPreviewPhotos();

  return (
    <section className="section sectionHalo" id="photography">
      <div className="container">
        <div className="sectionContent">
          <div className="featureCard">
            <div className="blockStack">
              <span className="sectionLabel" style={{ margin: 0 }}>
                Photography
              </span>
              <h2 className="h2">Landscape & portrait</h2>
              <p className="p-lg">
                A selection of photos I’ve taken — places, moments, and details,
                in both landscape and portrait.
              </p>
            </div>

            <div className="photoTeaserGrid blockGapLg">
              {previewPhotos.map((photo) => (
                <div key={photo.id} className="photoTeaserItem">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="photoTeaserImg"
                    sizes="(max-width: 600px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>

            <div className="blockGapLg" style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link href="/photography" className="sectionLink" style={{ fontWeight: 500 }}>
                View gallery →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
