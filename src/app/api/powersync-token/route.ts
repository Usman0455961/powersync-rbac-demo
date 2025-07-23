import { NextResponse } from "next/server";

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_POWERSYNC_URL ||
    !process.env.NEXT_PUBLIC_POWERSYNC_TOKEN
  ) {
    return NextResponse.json(
      { error: "PowerSync not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    endpoint: process.env.NEXT_PUBLIC_POWERSYNC_URL,
    token: process.env.NEXT_PUBLIC_POWERSYNC_TOKEN,
    userId: "example-user-id", // Replace with actual user ID from your auth system
  });
}
