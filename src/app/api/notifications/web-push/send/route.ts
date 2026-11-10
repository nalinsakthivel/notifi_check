import { DIAGNOSTICS, errorDiagnostic } from "@/lib/diagnostics";
import { NextRequest, NextResponse } from "next/server";
import { sendWebPushNotification } from "@/lib/fcm-service";
import { WebPushMessagePayload } from "@/lib/fcm-types";
import {
  parseServiceAccountForm,
  BadRequestError,
} from "@/lib/parse-service-account-form";
import {
  parseNotificationData,
  requireFields,
  publicError,
  InputError,
  validateOptionalUrl,
} from "@/lib/notification-validation";

export async function POST(request: NextRequest) {
  try {
    const { serviceAccount, fields } = await parseServiceAccountForm(request);
    const { fcmToken, title, body, data, link, icon, image, validateOnly } =
      fields;

    if (
      validateOnly !== undefined &&
      !["true", "false", "1", "0"].includes(validateOnly)
    )
      throw new InputError("validateOnly must be true or false.");
    const shouldValidateOnly = validateOnly === "true" || validateOnly === "1";

    requireFields(fields, ["fcmToken", "title", "body"]);

    const payload: WebPushMessagePayload = {
      fcmToken,
      title,
      body,
      data: parseNotificationData(data),
      link: validateOptionalUrl(link),
      icon: validateOptionalUrl(icon),
      image: validateOptionalUrl(image),
      validateOnly: shouldValidateOnly,
    };

    const result = await sendWebPushNotification(serviceAccount, payload);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (rawError: unknown) {
    if (rawError instanceof BadRequestError || rawError instanceof InputError) {
      return NextResponse.json(
        {
          success: false,
          error: DIAGNOSTICS[errorDiagnostic(rawError)][1],
          diagnosticCode: errorDiagnostic(rawError),
        },
        { status: 400 },
      );
    }
    const error = publicError(rawError);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
        diagnosticCode: "unexpected",
      },
      { status: 500 },
    );
  }
}
