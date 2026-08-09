export type FcmPriority = "" | "NORMAL" | "HIGH";
export type ApnsPriority = "" | "5" | "10";

export interface FcmPayloadInput {
  token: string;
  title: string;
  body: string;
  imageUrl: string;
  dataPairs: { key: string; value: string }[];
  android: {
    enabled: boolean;
    priority: FcmPriority;
    ttl: string; // seconds, blank = unset
    collapseKey: string;
    channelId: string;
  };
  apns: {
    enabled: boolean;
    priority: ApnsPriority;
    sound: string;
    badge: string; // blank = unset
  };
  webpush: {
    enabled: boolean;
    link: string;
    icon: string;
  };
}

export function emptyFcmPayloadInput(): FcmPayloadInput {
  return {
    token: "",
    title: "",
    body: "",
    imageUrl: "",
    dataPairs: [{ key: "", value: "" }],
    android: { enabled: false, priority: "", ttl: "", collapseKey: "", channelId: "" },
    apns: { enabled: false, priority: "", sound: "", badge: "" },
    webpush: { enabled: false, link: "", icon: "" },
  };
}

/** Build the FCM `message` object exactly as the Admin SDK / HTTP v1 API expects it. */
export function buildFcmMessage(input: FcmPayloadInput): Record<string, unknown> {
  const message: Record<string, unknown> = {};

  if (input.token.trim()) message.token = input.token.trim();

  if (input.title.trim() || input.body.trim() || input.imageUrl.trim()) {
    message.notification = {
      ...(input.title.trim() && { title: input.title.trim() }),
      ...(input.body.trim() && { body: input.body.trim() }),
      ...(input.imageUrl.trim() && { image: input.imageUrl.trim() }),
    };
  }

  const data = Object.fromEntries(
    input.dataPairs.filter((p) => p.key.trim()).map((p) => [p.key.trim(), p.value])
  );
  if (Object.keys(data).length) message.data = data;

  if (input.android.enabled) {
    const a = input.android;
    const androidConfig: Record<string, unknown> = {
      ...(a.priority && { priority: a.priority.toLowerCase() }),
      ...(a.ttl.trim() && { ttl: `${a.ttl.trim()}s` }),
      ...(a.collapseKey.trim() && { collapse_key: a.collapseKey.trim() }),
      ...(a.channelId.trim() && { notification: { channel_id: a.channelId.trim() } }),
    };
    if (Object.keys(androidConfig).length) message.android = androidConfig;
  }

  if (input.apns.enabled) {
    const p = input.apns;
    const aps: Record<string, unknown> = {
      ...(p.sound.trim() && { sound: p.sound.trim() }),
      ...(p.badge.trim() && { badge: Number(p.badge.trim()) }),
    };
    const apnsConfig: Record<string, unknown> = {
      ...(p.priority && { headers: { "apns-priority": p.priority } }),
      ...(Object.keys(aps).length && { payload: { aps } }),
    };
    if (Object.keys(apnsConfig).length) message.apns = apnsConfig;
  }

  if (input.webpush.enabled) {
    const w = input.webpush;
    const webpushConfig: Record<string, unknown> = {
      ...((w.link.trim() || w.icon.trim()) && {
        notification: {
          ...(w.icon.trim() && { icon: w.icon.trim() }),
        },
      }),
      ...(w.link.trim() && { fcm_options: { link: w.link.trim() } }),
    };
    if (Object.keys(webpushConfig).length) message.webpush = webpushConfig;
  }

  return message;
}

export function toCurl(message: Record<string, unknown>, projectId = "YOUR_PROJECT_ID"): string {
  const body = JSON.stringify({ message }, null, 2);
  return [
    `curl -X POST "https://fcm.googleapis.com/v1/projects/${projectId}/messages:send" \\`,
    `  -H "Authorization: Bearer $ACCESS_TOKEN" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${body}'`,
  ].join("\n");
}

export function toNode(message: Record<string, unknown>): string {
  return [
    `const admin = require("firebase-admin");`,
    ``,
    `admin.initializeApp({ credential: admin.credential.applicationDefault() });`,
    ``,
    `const message = ${JSON.stringify(message, null, 2)};`,
    ``,
    `admin.messaging().send(message)`,
    `  .then((id) => console.log("Sent:", id))`,
    `  .catch((err) => console.error("Error:", err));`,
  ].join("\n");
}

export function toFlutter(message: Record<string, unknown>): string {
  const dataObj = (message.data as Record<string, string> | undefined) ?? {};
  const dataEntries = Object.entries(dataObj)
    .map(([k, v]) => `    '${k}': '${v}',`)
    .join("\n");
  return [
    `// Client-side receive handler (sending still requires the Admin SDK / REST API server-side).`,
    `FirebaseMessaging.onMessage.listen((RemoteMessage message) {`,
    `  final notification = message.notification;`,
    `  final data = message.data;`,
    `  // notification?.title, notification?.body`,
    `  // Expected data payload for this message:`,
    `  // {`,
    dataEntries || `  //   (none)`,
    `  // }`,
    `});`,
  ].join("\n");
}
