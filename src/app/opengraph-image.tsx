import { ImageResponse } from "next/og";

export const alt = "Notifi Check — FCM Push Notification Tester";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#050608",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(228,228,231,0.08) 1.5px, transparent 0)",
          backgroundSize: "36px 36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="120" height="120" viewBox="0 0 72 72" fill="none">
            <path
              d="M23 44V31C23 22 29.8 15 38 15C46.2 15 53 22 53 31V44L57 50H19L23 44Z"
              stroke="#e4e4e7"
              strokeWidth="3.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d="M31 50C31 53.3 33.7 56 37 56C40.3 56 43 53.3 43 50"
              stroke="#e4e4e7"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="53" cy="20" r="12" fill="#3b82f6" stroke="#3b82f6" strokeWidth="3" />
            <path
              d="M47.5 20L51.5 24L59 15.5"
              stroke="#050608"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 600,
              letterSpacing: -1,
              color: "#e4e4e7",
            }}
          >
            NOTIFI<span style={{ color: "#3b82f6" }}>.CHECK</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 28,
            letterSpacing: 4,
            color: "#71717a",
          }}
        >
          FCM PUSH NOTIFICATION TESTER
        </div>
      </div>
    ),
    { ...size }
  );
}
