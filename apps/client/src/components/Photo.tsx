import React, { useState, useEffect, useRef } from "react";

export interface PhotoProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  focalPoint?: string;
  priority?: boolean;
  className?: string;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  sizes?: string;
  fill?: boolean;
}

export function Photo({
  src,
  alt,
  width,
  height,
  focalPoint = "50% 50%",
  priority = false,
  className = "",
  fallbackTitle,
  fallbackSubtitle,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px",
  fill = false,
}: PhotoProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [triedAlternative, setTriedAlternative] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // If the initial src prop changes, reset
  useEffect(() => {
    setCurrentSrc(src);
    setTriedAlternative(false);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  // Check if image is already cached/complete
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [currentSrc]);

  // Derive srcset paths for WebP and AVIF
  const extIndex = currentSrc.lastIndexOf(".");
  const basePath = extIndex !== -1 ? currentSrc.slice(0, extIndex) : currentSrc;

  // Use appropriate widths: ultra-wide hero (>=1600) has [640, 1024, 1600, 2400], cards have [640, 1024]
  const isWide = width >= 1600;
  const widths = isWide ? [640, 1024, 1600, 2400] : [640, 1024];

  const avifSrcSet = widths
    .map((w) => `${basePath}-${w}.avif ${w}w`)
    .join(", ");

  const webpSrcSet = widths
    .map((w) => `${basePath}-${w}.webp ${w}w`)
    .join(", ");

  const isFill = fill || className.includes("hero-slide") || className.includes("dest-card") || className.includes("calm-photo");

  const wrapperStyle: React.CSSProperties = isFill
    ? { width: "100%", height: "100%" }
    : {
        aspectRatio: `${width} / ${height}`,
        width: "100%",
        maxWidth: `${width}px`,
      };

  const handleImgError = () => {
    // If it failed on .jpg and hasn't tried .jpeg yet, try .jpeg (or vice versa)
    if (!triedAlternative) {
      setTriedAlternative(true);
      if (currentSrc.endsWith(".jpg")) {
        setCurrentSrc(currentSrc.replace(/\.jpg$/, ".jpeg"));
        return;
      }
      if (currentSrc.endsWith(".jpeg")) {
        setCurrentSrc(currentSrc.replace(/\.jpeg$/, ".jpg"));
        return;
      }
    }
    setHasError(true);
  };

  if (hasError || !src) {
    return (
      <div
        className={`photo-fallback-container ${className} ${isFill ? "fill" : ""}`}
        style={wrapperStyle}
        data-testid="photo-fallback"
        role="img"
        aria-label={alt || fallbackTitle || "Destination image placeholder"}
      >
        <div className="photo-fallback-content">
          <div className="fallback-compass-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.25" />
            </svg>
          </div>
          {fallbackTitle && <span className="fallback-title">{fallbackTitle}</span>}
          {fallbackSubtitle && <span className="fallback-subtitle">{fallbackSubtitle}</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`photo-wrapper ${className} ${isFill ? "fill" : ""} ${isLoaded ? "is-loaded" : "is-loading"}`}
      style={wrapperStyle}
    >
      <picture>
        <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          style={{ objectPosition: focalPoint }}
          className={`photo-img ${isLoaded ? "visible" : "hidden"}`}
          onLoad={() => setIsLoaded(true)}
          onError={handleImgError}
        />
      </picture>
      {!isLoaded && <div className="photo-placeholder-shimmer" aria-hidden="true" />}
    </div>
  );
}
