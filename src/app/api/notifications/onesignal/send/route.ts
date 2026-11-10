import { DIAGNOSTICS, errorDiagnostic } from "@/lib/diagnostics";
import { NextRequest, NextResponse } from "next/server";
import { sendOneSignalNotification } from "@/lib/onesignal-service";
import { OneSignalMessagePayload } from "@/lib/onesignal-types";
import {
  readNotificationForm,
  requireFields,
  validateOptionalUrl,
  InputError,
  parseNotificationData,
  publicError,
  MAX_FIELD_LENGTH,
} from "@/lib/notification-validation";

export async function POST(request: NextRequest) {
  try {
    const form = await readNotificationForm(request);
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
          error:
            "Missing required fields: appId, restApiKey, playerId, title, and body are required.",
          diagnosticCode: "input-invalid",
        },
        { status: 400 },
      );
    }

    if (
      [appId, restApiKey, playerId, title, body].some(
        (v) => (v as string).length > MAX_FIELD_LENGTH,
      )
    ) {
      throw new InputError(
        "One or more fields exceed the maximum allowed length.",
      );
    }
    requireFields({ appId, restApiKey, playerId, title, body }, [
      "appId",
      "restApiKey",
      "playerId",
      "title",
      "body",
    ]);
    const parsedData = parseNotificationData(
      typeof data === "string" ? data : undefined,
    );

    const payload: OneSignalMessagePayload = {
      appId,
      restApiKey,
      playerId,
      title,
      body,
      url: validateOptionalUrl(typeof url === "string" ? url : undefined),
      data: parsedData,
    };

    const result = await sendOneSignalNotification(payload);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (rawError: unknown) {
    if (rawError instanceof InputError)
      return NextResponse.json(
        {
          success: false,
          error: DIAGNOSTICS[errorDiagnostic(rawError)][1],
          diagnosticCode: errorDiagnostic(rawError),
        },
        { status: 400 },
      );
    const message = publicError(rawError).message;
    return NextResponse.json(
      {
        success: false,
        error: message || "An unexpected error occurred",
        diagnosticCode: "unexpected",
      },
      { status: 500 },
    );
  }
}
