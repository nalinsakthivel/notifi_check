import { NextRequest, NextResponse } from "next/server";
import { sendOneSignalNotification } from "@/lib/onesignal-service";
import { OneSignalMessagePayload } from "@/lib/onesignal-types";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const appId = form.get("appId");
    const restApiKey = form.get("restApiKey");
    const playerId = form.get("playerId");
    const title = form.get("title");
    const body = form.get("body");
    const url = form.get("url");
    const data = form.get("data");

    if (
      typeof appId !== "string" ||
      typeof restApiKey !== "string" ||
      typeof playerId !== "string" ||
      typeof title !== "string" ||
      typeof body !== "string" ||
      !appId ||
      !restApiKey ||
      !playerId ||
      !title ||
      !body
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: appId, restApiKey, playerId, title, and body are required.",
        },
        { status: 400 }
      );
    }

    let parsedData: Record<string, string> | undefined;
    if (typeof data === "string" && data.trim()) {
      try {
        parsedData = JSON.parse(data);
      } catch {
        return NextResponse.json(
          { success: false, error: "data field is not valid JSON." },
          { status: 400 }
        );
      }
    }

    const payload: OneSignalMessagePayload = {
      appId,
      restApiKey,
      playerId,
      title,
      body,
      url: typeof url === "string" ? url : undefined,
      data: parsedData,
    };

    const result = await sendOneSignalNotification(payload);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (rawError: unknown) {
    console.error("Unhandled error in /api/notifications/onesignal/send:", rawError);
    const message = rawError instanceof Error ? rawError.message : String(rawError);
    return NextResponse.json(
      { success: false, error: message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
