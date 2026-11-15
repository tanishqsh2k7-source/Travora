import React, { useState, useEffect } from "react";
import { DESTINATIONS, type Destination } from "../content/destinations.js";
import { Photo } from "./Photo.js";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { MapPin } from "lucide-react";

interface HeroBannerProps {
  children?: React.ReactNode;
}

export function HeroBanner({ children }: HeroBannerProps) {
  // Use first 4 curated destinations for the hero slideshow
  const heroSlides: Destination[] = DESTINATIONS.slice(0, 4);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const interval = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [heroSlides.length, prefersReduced]);

  const activeSlide = heroSlides[currentSlideIdx] || heroSlides[0];

  return (
    <section className="editorial-hero" aria-label="Hero showcase">
      {/* Photo Slideshow Background */}
      <div className="hero-slideshow-container" aria-hidden="true">
        {heroSlides.map((slide, idx) => {
          const isActive = idx === currentSlideIdx;
          return (
            <div
              key={slide.slug}
              className={`hero-slide ${isActive ? "active" : "inactive"} ${prefersReduced ? "no-motion" : ""}`}
            >
              <Photo
                src={slide.heroImage}
                alt={slide.alt}
                width={2400}
                height={1600}
                priority={idx === 0}
                fallbackTitle={slide.name}
                fallbackSubtitle={slide.country}
                className="hero-slide-photo"
                sizes="100vw"
                fill
              />
            </div>
          );
        })}

        {/* Contrast Scrim: dark gradient overlay ensuring >= 4.5:1 contrast for white text */}
        <div className="hero-contrast-scrim" />
      </div>

      {/* Hero Content Container */}
      <div className="hero-content-wrapper">
        <div className="hero-copy-block">
          <h1 className="hero-headline">
            Plan the whole journey, door to door.
          </h1>
          <p className="hero-subline">
            Flights, stays and a day-by-day plan, including when to move on to your next hotel.
          </p>

          {/* Location badge (removed photographer attribution) */}
          <div className="hero-photo-credit">
            <MapPin className="w-3.5 h-3.5 inline-block text-terracotta" />
            <span>{activeSlide.name}, {activeSlide.country}</span>
          </div>
        </div>

        {/* Embedded / Overlapping Planner Card */}
        {children && <div className="hero-planner-slot">{children}</div>}
      </div>
    </section>
  );
}
