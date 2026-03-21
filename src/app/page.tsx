import { Hero } from "./components/hero";
import { Contact } from "./components/contact";
import { AureusShowcase } from "./components/AureusShowcase";
import Footer from "./components/Footer";
import HighSchoolSection from "./components/HighSchoolSection";
import { DailyWisdom } from "./components/DailyWisdom";
import PhotographySection from "./components/PhotographySection";

export default function Page() {
  return (
    <main id="content" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Hero />
      <HighSchoolSection />
      <DailyWisdom />
      <AureusShowcase />
      <PhotographySection />
      <Contact />
      <Footer />
    </main>
  );
}

