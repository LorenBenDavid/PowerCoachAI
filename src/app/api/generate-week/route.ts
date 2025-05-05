import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  console.log("📦 Payload received in API route:", payload);

  const response = await fetch(
    "https://careful-grouse-421.convex.site/vapi/generate-program",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const text = await response.text();
  console.log("📥 Raw response from Convex:", text);

  try {
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch (err) {
    console.error("❌ Failed to parse Convex JSON:", text);
    return NextResponse.json({ success: false, error: "Invalid JSON" });
  }
}
