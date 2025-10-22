import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

type Item = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  inStock: boolean;
};

const ITEMS: Item[] = [
  {
    id: "widget-001",
    name: "Widget",
    description: "General-purpose tool for everyday tasks.",
    priceCents: 2599,
    inStock: true,
  },
  {
    id: "gadget-002",
    name: "Gadget",
    description: "Handy gadget with configurable modules.",
    priceCents: 4899,
    inStock: false,
  },
  {
    id: "doodad-003",
    name: "Doodad",
    description: "Compact accessory ideal for travel kits.",
    priceCents: 1899,
    inStock: true,
  },
];

const API_KEY_HEADER = "x-api-key";

const safeEquals = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export async function GET(request: Request) {
  const configuredKey = process.env.API_KEY;

  if (!configuredKey) {
    return NextResponse.json(
      { error: "API key is not configured on the server." },
      { status: 500 },
    );
  }

  const providedKey = request.headers.get(API_KEY_HEADER);

  if (!providedKey) {
    return NextResponse.json({ error: "Missing API key." }, { status: 401 });
  }

  if (!safeEquals(providedKey, configuredKey)) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  return NextResponse.json({ items: ITEMS }, { status: 200 });
}
