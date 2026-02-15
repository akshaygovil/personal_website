"use client";

import { getTheme } from "../lib/useTheme";
import { ThemeToggle } from "./themeToggle";
import { useState, useEffect } from "react";

type HeroProps = {
  imageUrl?: string;
  heading?: string;
  subtitle?: string;
};

const NAV_LINKS = [
  { href: "#wisdom", label: "Wisdom" },
  { href: "#aureus", label: "Work" },
  { href: "#contact", label: "Contact" },
] as const;

export function Hero({
  imageUrl = "/hero.jpg",
  heading = "Building software, systems, and intelligent automation.",
  subtitle = "I build high-leverage systems that change the world.",
}: HeroProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = getTheme();

  useEffect(() => {
    const handleScroll = () => {
      const threshold = 24;
      setIsScrolled(window.scrollY > threshold);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Top navigation bar */}
      <nav
        className={`navBar navBarHero ${isScrolled ? "isScrolled" : ""}`}
        aria-label="Main navigation"
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          {/* Logo / Site name */}
          <a
            href="/"
            className="navBarLogo"
            onClick={(e) => {
              if (window.location.pathname === "/" && window.location.hash === "") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            Akshay Govil
          </a>

          {/* Desktop nav links */}
          <ul className="navBarLinks">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  className="navBarLink"
                  onClick={closeMobileMenu}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right: theme toggle + mobile menu button */}
          <div className="navBarRight">
            <ThemeToggle />
            <button
              type="button"
              className="navBarMenuButton"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="nav-mobile-menu"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="nav-mobile-menu"
        className={`navBarMobileMenu ${mobileMenuOpen ? "isOpen" : ""}`}
        aria-hidden={!mobileMenuOpen}
        role="dialog"
        aria-label="Mobile navigation"
      >
        {NAV_LINKS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="navBarMobileLink"
            onClick={closeMobileMenu}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Hero section */}
      <header
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100svh",
          height: "100vh",
          display: "grid",
          alignItems: "center",
          overflow: "hidden",
        }}
        aria-label="Hero"
      >
        {/* Background image */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: "scale(1.02)",
          }}
        />
        {/* Dark overlay for readability */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 42%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.10) 100%)",
          }}
        />
        {/* Accent glow / halo on the left */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(680px 340px at 12% 48%, var(--accent-glow), transparent 55%)",
            mixBlendMode: "screen",
            opacity: 0.95,
          }}
        />
        {/* Bottom blend: fade hero into page background (white / dark) */}
        <div
          aria-hidden="true"
          className="heroBottomBlend"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "58%",
            background: `linear-gradient(to top, var(--bg) 0%, transparent 62%)`,
            pointerEvents: "none",
          }}
        />
        {/* Content */}
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="sectionContent">
            <h1
              className="h1"
              style={{
                color: "rgba(245,247,250,1)",
                textShadow: "0 10px 30px rgba(0,0,0,0.55)",
                whiteSpace: "pre-line",
              }}
            >
              {heading}
            </h1>
            <p
              className="p-lg blockGap"
              style={{
                maxWidth: "58ch",
                color: "rgba(225,231,239,0.88)",
                textShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              {subtitle}
            </p>
            {/* CTA row */}
            <div
              className="blockGapLg"
              style={{ display: "flex", gap: "var(--block-gap-xl)", flexWrap: "wrap", alignItems: "center" }}
            >
              <a
                className="btn btnPrimary"
                href="#aureus"
                style={{ color: "#fff" }}
              >
                View work
              </a>
              <button
                className="btn"
                onClick={() => {
                  document.getElementById("contact")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "rgba(245,247,250,0.9)",
                }}
              >
                Get in touch
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
