import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const feedbackTo = process.env.FEEDBACK_TO_EMAIL;
    if (!apiKey || !feedbackTo) {
      console.error("RESEND_API_KEY / FEEDBACK_TO_EMAIL is not configured");
      return NextResponse.json(
        { success: false, error: "Feedback is not configured on this server." },
        { status: 500 }
      );
    }

    const form = await request.formData();
    const message = form.get("message");
    const email = form.get("email");
    const page = form.get("page");
    const screenshot = form.get("screenshot");

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      );
    }
    if (typeof email === "string" && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid email address, or leave it blank." },
        { status: 400 }
      );
    }

    let attachment: { filename: string; content: Buffer } | undefined;
    if (screenshot instanceof File && screenshot.size > 0) {
      if (!screenshot.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, error: "Screenshot must be an image file." },
          { status: 400 }
        );
      }
      if (screenshot.size > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json(
          { success: false, error: "Screenshot must be smaller than 5 MB." },
          { status: 400 }
        );
      }
      attachment = {
        filename: screenshot.name || "screenshot.png",
        content: Buffer.from(await screenshot.arrayBuffer()),
      };
    }

    const resend = new Resend(apiKey);
    const html = `
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      ${email ? `<p><strong>From:</strong> ${escapeHtml(String(email))}</p>` : ""}
      ${page ? `<p><strong>Page:</strong> ${escapeHtml(String(page))}</p>` : ""}
    `;

    const result = await resend.emails.send({
      // TODO: switch to feedback@notificheck.com once the domain shows Verified in Resend.
      from: "Notifi Check Feedback <onboarding@resend.dev>",
      to: feedbackTo,
      replyTo: typeof email === "string" && email ? email : undefined,
      subject: "New feedback — Notifi Check",
      html,
      attachments: attachment ? [attachment] : undefined,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return NextResponse.json(
        { success: false, error: result.error.message || "Failed to send feedback." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (rawError: unknown) {
    console.error("Unhandled error in /api/feedback/send:", rawError);
    const message = rawError instanceof Error ? rawError.message : String(rawError);
    return NextResponse.json(
      { success: false, error: message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
