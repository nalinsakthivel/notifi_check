import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/lib/fcm-service";
import { FCMMessagePayload } from "@/lib/fcm-types";
import { parseServiceAccountForm, BadRequestError } from "@/lib/parse-service-account-form";
import { toFirebaseLikeError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const { serviceAccount, fields } = await parseServiceAccountForm(request);
    const { fcmToken, title, body, data } = fields;

    if (!fcmToken || !title || !body) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: fcmToken, title, and body are required.",
        },
        { status: 400 }
      );
    }

    const payload: FCMMessagePayload = {
      fcmToken,
      title,
      body,
      data: data ? JSON.parse(data) : undefined,
    };

    const result = await sendNotification(serviceAccount, payload);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (rawError: unknown) {
    if (rawError instanceof BadRequestError) {
      return NextResponse.json({ success: false, error: rawError.message }, { status: 400 });
    }
    console.error("Unhandled error in /api/notifications/send:", rawError);
    const error = toFirebaseLikeError(rawError);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
