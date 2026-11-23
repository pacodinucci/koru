import type { Metadata } from "next";
import sharePreview from "@/lib/share-preview.json";
import { HomeView } from "@/modules/home/views/home-view";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Koru",
    title: "Koru",
    description: "Koru OSA. Tepoztlán.",
    images: [{ url: sharePreview.url, width: sharePreview.width, height: sharePreview.height, alt: sharePreview.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Koru",
    description: "Koru OSA. Tepoztlán.",
    images: [sharePreview.url],
  },
};

export default function HomePage() {
  return <HomeView />;
}
