import React, { useState } from "react";

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
}: PhotoProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Derive srcset paths for WebP and AVIF
  const extIndex = src.lastIndexOf(".");
  const basePath = extIndex !== -1 ? src.slice(0, extIndex) : src;

  const avifSrcSet = [640, 1024, 1600, 2400]
    .map((w) => `${basePath}-${w}.avif ${w}w`)
    .join(", ");

  const webpSrcSet = [640, 1024, 1600, 2400]
    .map((w) => `${basePath}-${w}.webp ${w}w`)
    .join(", ");

  if (hasError || !src) {
    return (
      <div
        className={`photo-fallback-container ${className}`}
        style={{
          aspectRatio: `${width} / ${height}`,
          width: "100%",
          maxWidth: `${width}px`,
        }}
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
      className={`photo-wrapper ${className} ${isLoaded ? "is-loaded" : "is-loading"}`}
      style={{
        aspectRatio: `${width} / ${height}`,
        width: "100%",
        maxWidth: `${width}px`,
      }}
    >
      <picture>
        <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          style={{ objectPosition: focalPoint }}
          className={`photo-img ${isLoaded ? "visible" : "hidden"}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      </picture>
      {!isLoaded && <div className="photo-placeholder-shimmer" aria-hidden="true" />}
    </div>
  );
}
