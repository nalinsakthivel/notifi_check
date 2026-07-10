import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const VISITS_KEY = "notifi_check:visits";

export async function POST() {
  try {
    const count = await redis.incr(VISITS_KEY);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to increment visit count:", error);
    return NextResponse.json({ count: null }, { status: 500 });
  }
}

export async function GET() {
  try {
    const count = (await redis.get<number>(VISITS_KEY)) ?? 0;
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to read visit count:", error);
    return NextResponse.json({ count: null }, { status: 500 });
  }
}
