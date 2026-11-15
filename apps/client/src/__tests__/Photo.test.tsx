import React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Photo } from "../components/Photo.js";

describe("Photo component", () => {
  it("renders a picture element with srcset and fallback img", () => {
    const { container } = render(
      <Photo
        src="/images/destinations/lisbon-hero.jpg"
        alt="Lisbon viewpoint"
        width={2400}
        height={1600}
        fallbackTitle="Lisbon"
        fallbackSubtitle="Portugal"
      />
    );

    const picture = container.querySelector("picture");
    expect(picture).toBeTruthy();

    const sources = container.querySelectorAll("source");
    expect(sources.length).toBe(2); // AVIF and WebP sources
    expect(sources[0].getAttribute("type")).toBe("image/avif");
    expect(sources[1].getAttribute("type")).toBe("image/webp");

    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("alt")).toBe("Lisbon viewpoint");
    expect(img?.getAttribute("loading")).toBe("lazy");
  });

  it("switches to branded fallback card on image load error", () => {
    render(
      <Photo
        src="/images/destinations/non-existent.jpg"
        alt="Missing image"
        width={1200}
        height={800}
        fallbackTitle="Udaipur Palace"
        fallbackSubtitle="Rajasthan, India"
      />
    );

    // Initial error on .jpg triggers retry with .jpeg
    let img = screen.getByRole("img", { name: "Missing image" });
    fireEvent.error(img);

    // Second error on .jpeg triggers fallback card
    img = screen.getByRole("img", { name: "Missing image" });
    fireEvent.error(img);

    expect(screen.getByText("Udaipur Palace")).toBeTruthy();
    expect(screen.getByText("Rajasthan, India")).toBeTruthy();
  });
});
