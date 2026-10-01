import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { HotelServiceApi } from "@/lib/services/hotel";
import PropertyDetailsClient from "./PropertyDetailsClient";

export const dynamic = "force-dynamic";

// One lookup per request, shared by generateMetadata and the page.
const loadListing = cache(async (id: string) => {
  if (!/^\d+$/.test(id)) return null;
  try {
    return await HotelServiceApi.getHotelDetail(id);
  } catch (err) {
    console.error("[property page] failed to load listing", id, err);
    // Treat a backend failure as "unknown" rather than "missing": the client
    // retries and shows a proper error state instead of a false 404.
    return undefined;
  }
});

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const row: any = await loadListing(id);
  if (!row) return { title: "Stay not found · Hostiggo" };
  const place = [row.locations?.district, row.locations?.state].filter(Boolean).join(", ");
  const description = String(row.description ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
  const cover =
    row.listing_media?.find((m: any) => m.is_cover)?.media_url ?? row.listing_media?.[0]?.media_url;
  const title = `${row.title}${place ? ` · ${place}` : ""} · Hostiggo`;
  return {
    title,
    description,
    openGraph: { title, description, ...(cover ? { images: [cover] } : {}) },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  const row = await loadListing(id);
  // null = the listing doesn't exist or isn't live -> a real 404, not a
  // "Property not found" page served with HTTP 200.
  if (row === null) notFound();
  return <PropertyDetailsClient initialRow={row ?? null} />;
}
