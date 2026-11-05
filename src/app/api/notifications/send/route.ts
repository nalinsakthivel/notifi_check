import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/lib/fcm-service";
import { FCMMessagePayload } from "@/lib/fcm-types";
import { parseServiceAccountForm, BadRequestError } from "@/lib/parse-service-account-form";
import { parseNotificationData, requireFields, publicError, InputError } from "@/lib/notification-validation";

export async function POST(request: NextRequest) {
  try {
    const { serviceAccount, fields } = await parseServiceAccountForm(request);
    const { fcmToken, title, body, data } = fields;

    requireFields(fields, ["fcmToken", "title", "body"]);
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
      data: parseNotificationData(data),
    };

    const result = await sendNotification(serviceAccount, payload);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (rawError: unknown) {
    if (rawError instanceof BadRequestError || rawError instanceof InputError) {
      return NextResponse.json({ success: false, error: rawError.message }, { status: 400 });
    }
    const error = publicError(rawError);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
