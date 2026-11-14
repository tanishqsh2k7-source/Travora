import React from "react";
import { ArrowRightIcon, SparklesIcon } from "./Icons";

interface HeroBannerProps {
  onCraftTrip: () => void;
  isFormOpen: boolean;
}

export function HeroBanner({ onCraftTrip, isFormOpen }: HeroBannerProps) {
  return (
    <section className="hero-travel-banner">
      {/* Background Aurora Glow Effects */}
      <div className="hero-aurora-glow" aria-hidden="true" />

      {/* Background World Map Vector Pattern */}
      <div className="hero-world-map" aria-hidden="true">
        <svg viewBox="0 0 1000 450" fill="currentColor" className="world-map-svg">
          {/* North America */}
          <path d="M150,80 Q190,50 240,65 Q270,90 280,130 Q260,170 230,185 Q200,210 185,170 Q140,150 130,120 Z" opacity="0.14" />
          <path d="M110,60 Q130,40 160,50 Q170,75 140,85 Z" opacity="0.12" />
          <path d="M220,190 Q240,210 260,250 Q240,260 220,240 Q210,210 220,190 Z" opacity="0.14" />
          {/* South America */}
          <path d="M250,250 Q300,270 330,320 Q320,380 280,410 Q250,370 240,310 Q235,270 250,250 Z" opacity="0.14" />
          {/* Europe */}
          <path d="M470,70 Q520,60 550,90 Q540,130 500,140 Q460,130 460,90 Z" opacity="0.15" />
          <path d="M440,75 Q460,65 470,85 Q450,95 440,75 Z" opacity="0.13" />
          {/* Africa */}
          <path d="M470,160 Q550,160 570,220 Q560,300 510,340 Q470,300 450,220 Q450,180 470,160 Z" opacity="0.14" />
          {/* Asia */}
          <path d="M560,65 Q650,40 760,60 Q820,100 850,150 Q810,210 740,220 Q680,240 640,200 Q590,200 560,150 Q540,100 560,65 Z" opacity="0.15" />
          <path d="M680,210 Q720,220 740,260 Q700,290 670,260 Z" opacity="0.14" />
          {/* Australia */}
          <path d="M780,290 Q850,280 880,330 Q850,380 800,370 Q760,340 780,290 Z" opacity="0.14" />
        </svg>
      </div>

      {/* Floating Hot Air Balloons - Colorful & Luminous */}
      <div className="balloon balloon-left" aria-hidden="true">
        <svg viewBox="0 0 50 70" className="balloon-svg">
          <ellipse cx="25" cy="25" rx="20" ry="24" fill="#ec4899" />
          <path d="M12,25 Q25,3 38,25 Q25,47 12,25 Z" fill="#f43f5e" opacity="0.85" />
          <path d="M18,25 Q25,8 32,25 Q25,42 18,25 Z" fill="#ffffff" opacity="0.75" />
          <path d="M19,48 L31,48 L27,55 L23,55 Z" fill="#9f1239" />
          <rect x="22" y="58" width="6" height="6" rx="1" fill="#fbbf24" />
          <line x1="20" y1="52" x2="23" y2="58" stroke="#f59e0b" strokeWidth="1" />
          <line x1="30" y1="52" x2="27" y2="58" stroke="#f59e0b" strokeWidth="1" />
        </svg>
      </div>

      <div className="balloon balloon-right" aria-hidden="true">
        <svg viewBox="0 0 50 70" className="balloon-svg">
          <ellipse cx="25" cy="25" rx="18" ry="22" fill="#06b6d4" />
          <path d="M14,25 Q25,5 36,25 Q25,45 14,25 Z" fill="#3b82f6" opacity="0.85" />
          <path d="M19,25 Q25,10 31,25 Q25,40 19,25 Z" fill="#ffffff" opacity="0.75" />
          <path d="M20,46 L30,46 L27,52 L23,52 Z" fill="#0369a1" />
          <rect x="22" y="55" width="6" height="5" rx="1" fill="#f59e0b" />
          <line x1="21" y1="49" x2="23" y2="55" stroke="#f59e0b" strokeWidth="1" />
          <line x1="29" y1="49" x2="27" y2="55" stroke="#f59e0b" strokeWidth="1" />
        </svg>
      </div>

      {/* Hero Typography & CTA */}
      <div className="hero-content">
        <div className="hero-sparkle-pill">
          <SparklesIcon className="w-4 h-4 text-amber" />
          <span>✨ Multi-Agent AI Travel Orchestrator</span>
        </div>

        <h1 className="hero-main-title">
          <span className="hero-title-gradient">Your Trip. Your Vibe.</span><br />
          <span className="hero-title-light">Our AI's on It.</span>
        </h1>

        <p className="hero-main-subtitle">
          Solo? Couple? Group? We Plan Like It's Just for You — Because It Is.
        </p>

        <div className="hero-cta-wrapper">
          <button
            type="button"
            className={`btn-hero-cta ${isFormOpen ? "btn-hero-cta-active" : ""}`}
            onClick={onCraftTrip}
            aria-expanded={isFormOpen}
          >
            <span>{isFormOpen ? "✨ Customize Trip Details Below" : "Craft a trip in seconds"}</span>
            <ArrowRightIcon className={`hero-arrow-icon ${isFormOpen ? "rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {/* World Landmarks Skyline - Rich Colorful Monuments */}
      <div className="hero-landmarks-skyline" aria-hidden="true">
        <svg
          viewBox="0 0 1200 160"
          preserveAspectRatio="xMidYMax meet"
          className="landmarks-svg"
        >
          {/* Taj Mahal - Pearlescent Marble with Golden Domes */}
          <g transform="translate(60, 45)">
            <rect x="5" y="25" width="6" height="85" fill="#e2e8f0" />
            <polygon points="5,25 8,15 11,25" fill="#f1f5f9" />
            <rect x="135" y="25" width="6" height="85" fill="#e2e8f0" />
            <polygon points="135,25 138,15 141,25" fill="#f1f5f9" />
            <rect x="25" y="45" width="96" height="65" fill="#f8fafc" rx="2" />
            <path d="M53,110 L53,75 Q73,55 93,75 L93,110 Z" fill="#94a3b8" />
            <path d="M32,110 L32,85 Q40,75 48,85 L48,110 Z" fill="#cbd5e1" />
            <path d="M98,110 L98,85 Q106,75 114,85 L114,110 Z" fill="#cbd5e1" />
            <path d="M57,45 Q73,12 89,45 Z" fill="#ffffff" />
            <polygon points="72,13 73,5 74,13" fill="#fbbf24" />
            <path d="M38,45 Q46,28 54,45 Z" fill="#f1f5f9" />
            <path d="M92,45 Q100,28 108,45 Z" fill="#f1f5f9" />
          </g>

          {/* Roman Colosseum - Warm Terracotta Gold */}
          <g transform="translate(230, 65)">
            <path d="M0,90 L0,35 Q60,20 120,35 L120,90 Z" fill="#f59e0b" />
            <path d="M10,90 L10,45 Q60,35 110,45 L110,90 Z" fill="#d97706" opacity="0.8" />
            <path d="M12,85 Q18,72 24,85 M30,85 Q36,72 42,85 M48,85 Q54,72 60,85 M66,85 Q72,72 78,85 M84,85 Q90,72 96,85 M102,85 Q108,72 114,85" stroke="#78350f" strokeWidth="3" fill="none" />
            <path d="M14,68 Q20,56 26,68 M32,68 Q38,56 44,68 M50,68 Q56,56 62,68 M68,68 Q74,56 80,68 M86,68 Q92,56 98,68 M104,68 Q108,56 112,68" stroke="#78350f" strokeWidth="2.5" fill="none" />
          </g>

          {/* Statue of Liberty - Vibrant Verdigris Jade & Golden Torch */}
          <g transform="translate(380, 20)">
            <polygon points="12,135 38,135 35,110 15,110" fill="#475569" />
            <rect x="18" y="95" width="14" height="15" fill="#64748b" />
            <polygon points="18,95 32,95 28,45 22,45" fill="#14b8a6" />
            <circle cx="25" cy="38" r="6" fill="#2dd4bf" />
            <polygon points="21,34 25,27 29,34" fill="#0d9488" />
            <line x1="28" y1="46" x2="38" y2="22" stroke="#2dd4bf" strokeWidth="3" />
            <polygon points="36,22 40,22 38,15" fill="#fbbf24" />
            <circle cx="38" cy="14" r="2.5" fill="#f43f5e" />
          </g>

          {/* Big Ben / Elizabeth Tower - Amber Gothic Clock Tower */}
          <g transform="translate(450, 10)">
            <rect x="15" y="55" width="26" height="95" fill="#b45309" />
            <rect x="18" y="60" width="20" height="85" fill="#d97706" />
            <rect x="12" y="32" width="32" height="25" fill="#92400e" rx="1" />
            <circle cx="28" cy="44" r="8" fill="#fef3c7" stroke="#78350f" strokeWidth="1.5" />
            <line x1="28" y1="44" x2="28" y2="39" stroke="#78350f" strokeWidth="1.5" />
            <line x1="28" y1="44" x2="32" y2="44" stroke="#78350f" strokeWidth="1.5" />
            <polygon points="14,32 28,2 42,32" fill="#78350f" />
            <line x1="28" y1="2" x2="28" y2="0" stroke="#fef08a" strokeWidth="2" />
          </g>

          {/* Eiffel Tower - Radiant Sunset Gold Lattice */}
          <g transform="translate(530, 5)">
            <path d="M10,145 Q35,95 60,145 L50,145 Q35,115 20,145 Z" fill="#ca8a04" />
            <polygon points="12,145 22,95 48,95 58,145" fill="#eab308" opacity="0.9" />
            <rect x="20" y="90" width="30" height="5" fill="#a16207" />
            <polygon points="22,90 28,50 42,50 48,90" fill="#facc15" />
            <rect x="26" y="47" width="18" height="4" fill="#a16207" />
            <polygon points="28,47 34,5 36,5 42,47" fill="#eab308" />
            <line x1="35" y1="5" x2="35" y2="0" stroke="#fef08a" strokeWidth="2.5" />
          </g>

          {/* Pyramids of Giza - Warm Desert Ochre */}
          <g transform="translate(630, 55)">
            <polygon points="0,95 65,15 95,95" fill="#f59e0b" />
            <polygon points="65,15 95,95 130,95" fill="#d97706" />
            <polygon points="80,95 125,40 150,95" fill="#fbbf24" />
            <polygon points="125,40 150,95 175,95" fill="#b45309" />
          </g>

          {/* Leaning Tower of Pisa - Marble Colonnade */}
          <g transform="translate(800, 35)">
            <g transform="rotate(7, 25, 115)">
              <rect x="8" y="25" width="28" height="90" fill="#f8fafc" rx="2" />
              <rect x="5" y="32" width="34" height="4" fill="#cbd5e1" />
              <rect x="5" y="46" width="34" height="4" fill="#cbd5e1" />
              <rect x="5" y="60" width="34" height="4" fill="#cbd5e1" />
              <rect x="5" y="74" width="34" height="4" fill="#cbd5e1" />
              <rect x="5" y="88" width="34" height="4" fill="#cbd5e1" />
              <rect x="5" y="102" width="34" height="4" fill="#cbd5e1" />
              <rect x="12" y="12" width="20" height="13" fill="#e2e8f0" rx="1" />
            </g>
          </g>

          {/* Red Torii / Bridge - Vibrant Crimson Landmark */}
          <g transform="translate(885, 40)">
            <rect x="8" y="20" width="8" height="95" fill="#ef4444" />
            <rect x="44" y="20" width="8" height="95" fill="#ef4444" />
            <rect x="0" y="28" width="60" height="8" fill="#dc2626" rx="2" />
            <rect x="4" y="44" width="52" height="6" fill="#dc2626" />
            <rect x="26" y="28" width="8" height="16" fill="#1e293b" />
          </g>

          {/* Modern Skyscraper - Glowing Cyan Windows */}
          <g transform="translate(970, 30)">
            <rect x="10" y="25" width="35" height="95" fill="#334155" />
            <polygon points="10,25 27,5 45,25" fill="#475569" />
            <circle cx="20" cy="40" r="2.5" fill="#38bdf8" />
            <circle cx="27" cy="40" r="2.5" fill="#38bdf8" />
            <circle cx="35" cy="40" r="2.5" fill="#38bdf8" />
            <circle cx="20" cy="55" r="2.5" fill="#38bdf8" />
            <circle cx="27" cy="55" r="2.5" fill="#38bdf8" />
            <circle cx="35" cy="55" r="2.5" fill="#38bdf8" />
            <circle cx="20" cy="70" r="2.5" fill="#38bdf8" />
            <circle cx="27" cy="70" r="2.5" fill="#38bdf8" />
            <circle cx="35" cy="70" r="2.5" fill="#38bdf8" />
            <circle cx="20" cy="85" r="2.5" fill="#38bdf8" />
            <circle cx="27" cy="85" r="2.5" fill="#38bdf8" />
            <circle cx="35" cy="85" r="2.5" fill="#38bdf8" />
          </g>

          {/* London Eye / Ferris Wheel - Vibrant Red Legs & Sky Blue Pods */}
          <g transform="translate(1040, 35)">
            <line x1="45" y1="50" x2="25" y2="115" stroke="#ef4444" strokeWidth="4" />
            <line x1="45" y1="50" x2="65" y2="115" stroke="#ef4444" strokeWidth="4" />
            <circle cx="45" cy="50" r="42" fill="none" stroke="#6366f1" strokeWidth="3" />
            <circle cx="45" cy="50" r="37" fill="none" stroke="#818cf8" strokeWidth="1.5" />
            <circle cx="45" cy="50" r="6" fill="#ec4899" />
            <line x1="45" y1="8" x2="45" y2="92" stroke="#818cf8" strokeWidth="1" />
            <line x1="3" y1="50" x2="87" y2="50" stroke="#818cf8" strokeWidth="1" />
            <line x1="15" y1="20" x2="75" y2="80" stroke="#818cf8" strokeWidth="1" />
            <line x1="15" y1="80" x2="75" y2="20" stroke="#818cf8" strokeWidth="1" />
            <circle cx="45" cy="8" r="4" fill="#38bdf8" />
            <circle cx="87" cy="50" r="4" fill="#38bdf8" />
            <circle cx="45" cy="92" r="4" fill="#38bdf8" />
            <circle cx="3" cy="50" r="4" fill="#38bdf8" />
            <circle cx="75" cy="20" r="4" fill="#38bdf8" />
            <circle cx="75" cy="80" r="4" fill="#38bdf8" />
            <circle cx="15" cy="80" r="4" fill="#38bdf8" />
            <circle cx="15" cy="20" r="4" fill="#38bdf8" />
          </g>
        </svg>

        {/* Radiant Horizon Gradient Strip */}
        <div className="hero-vibrant-ground" />
      </div>
    </section>
  );
}
