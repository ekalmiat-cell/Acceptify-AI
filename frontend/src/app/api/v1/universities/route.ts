import { NextResponse } from "next/server";
import fallbackUniversities from "@/data/universities.json";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(fallbackUniversities);
}
