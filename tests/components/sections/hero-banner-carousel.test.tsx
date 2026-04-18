/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroBannerCarousel } from "@/components/sections/hero-banner-carousel";
import type { BannerSlide } from "@/services/banner.server";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/a11y/useAltText: test mock
    <img src={src} alt={alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const makeSlide = (id: string, title: string, overrides: Partial<BannerSlide> = {}): BannerSlide => ({
  id,
  type: "custom",
  categoryId: null,
  categorySlug: null,
  imageUrl: `https://example.com/${id}.jpg`,
  title,
  subtitle: `Subtitle ${id}`,
  badgeText: `Badge ${id}`,
  ctaLabel: "Buy Now",
  ctaUrl: "/products",
  ctaSecondaryLabel: "Explore",
  discountTag: "50%",
  discountTagSub: "first order",
  accentColor: "violet",
  isActive: true,
  sortOrder: 0,
  startsAt: null,
  endsAt: null,
  ...overrides,
});

// Use simple ASCII titles to avoid Unicode normalization issues in test assertions
const slide1 = makeSlide("s1", "SLIDE ONE TITLE");
const slide2 = makeSlide("s2", "SLIDE TWO TITLE");
const slide3 = makeSlide("s3", "SLIDE THREE TITLE");

describe("HeroBannerCarousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the first slide title", () => {
    render(<HeroBannerCarousel slides={[slide1, slide2]} />);
    expect(screen.getByText(/SLIDE ONE TITLE/i)).toBeInTheDocument();
  });

  it("renders badge and CTA button for slide 1", () => {
    render(<HeroBannerCarousel slides={[slide1]} />);
    expect(screen.getByText("Badge s1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Buy Now/i })).toBeInTheDocument();
  });

  it("renders dot indicators when there are multiple slides", () => {
    render(<HeroBannerCarousel slides={[slide1, slide2, slide3]} />);
    const dots = screen.getAllByLabelText(/Chuyển sang slide/i);
    expect(dots).toHaveLength(3);
  });

  it("does not render dots when there is only 1 slide", () => {
    render(<HeroBannerCarousel slides={[slide1]} />);
    expect(screen.queryByLabelText(/Chuyển sang slide/i)).toBeNull();
  });

  it("clicking next arrow advances to slide 2", () => {
    render(<HeroBannerCarousel slides={[slide1, slide2]} />);
    const nextBtn = screen.getByLabelText("Slide tiếp theo");
    fireEvent.click(nextBtn);
    expect(screen.getByText(/SLIDE TWO TITLE/i)).toBeInTheDocument();
  });

  it("clicking prev arrow wraps to last slide", () => {
    render(<HeroBannerCarousel slides={[slide1, slide2, slide3]} />);
    const prevBtn = screen.getByLabelText("Slide trước");
    fireEvent.click(prevBtn);
    expect(screen.getByText(/SLIDE THREE TITLE/i)).toBeInTheDocument();
  });

  it("clicking a dot indicator switches to that slide", () => {
    render(<HeroBannerCarousel slides={[slide1, slide2, slide3]} />);
    const dots = screen.getAllByLabelText(/Chuyển sang slide/i);
    fireEvent.click(dots[1]); // click dot 2
    expect(screen.getByText(/SLIDE TWO TITLE/i)).toBeInTheDocument();
  });

  it("auto-advances to next slide after 5 seconds", () => {
    render(<HeroBannerCarousel slides={[slide1, slide2]} />);
    expect(screen.getByText(/SLIDE ONE TITLE/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/SLIDE TWO TITLE/i)).toBeInTheDocument();
  });

  it("renders discount tag when provided", () => {
    render(<HeroBannerCarousel slides={[slide1]} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("first order")).toBeInTheDocument();
  });

  it("does not render CTA button when ctaLabel or ctaUrl is missing", () => {
    const slide = makeSlide("s-no-cta", "No CTA Slide", { ctaLabel: null, ctaUrl: null });
    render(<HeroBannerCarousel slides={[slide]} />);
    expect(screen.queryByRole("link", { name: /Buy Now/i })).toBeNull();
  });

  it("renders nothing when slides array is empty", () => {
    const { container } = render(<HeroBannerCarousel slides={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
