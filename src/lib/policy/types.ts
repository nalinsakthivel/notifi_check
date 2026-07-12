import { z } from "zod";

export const APP_CATEGORIES = [
  "Education",
  "Business",
  "Finance",
  "Health",
  "Entertainment",
  "Productivity",
  "Shopping",
  "Social",
  "Travel",
  "Food",
  "Lifestyle",
  "Other",
] as const;

export const AGE_GROUPS = ["Everyone", "13+", "16+", "18+"] as const;

export interface CatalogItem {
  id: string;
  label: string;
}

export interface DataGroup {
  label: string;
  items: CatalogItem[];
}

export const DATA_GROUPS: DataGroup[] = [
  {
    label: "Personal Information",
    items: [
      { id: "name", label: "Name" },
      { id: "email", label: "Email" },
      { id: "phone", label: "Phone Number" },
      { id: "address", label: "Address" },
      { id: "dob", label: "Date of Birth" },
    ],
  },
  {
    label: "Device Information",
    items: [
      { id: "deviceId", label: "Device ID" },
      { id: "androidId", label: "Android ID" },
      { id: "advertisingId", label: "Advertising ID" },
      { id: "imei", label: "IMEI" },
    ],
  },
  {
    label: "Location",
    items: [
      { id: "approxLocation", label: "Approximate Location" },
      { id: "preciseLocation", label: "Precise Location" },
    ],
  },
  {
    label: "Media",
    items: [
      { id: "photos", label: "Photos" },
      { id: "videos", label: "Videos" },
      { id: "audio", label: "Audio" },
      { id: "files", label: "Files" },
    ],
  },
  {
    label: "Other Data",
    items: [
      { id: "contacts", label: "Contacts" },
      { id: "calendar", label: "Calendar" },
      { id: "healthData", label: "Health Data" },
      { id: "financialInfo", label: "Financial Information" },
      { id: "messages", label: "Messages" },
      { id: "callLogs", label: "Call Logs" },
      { id: "installedApps", label: "Installed Apps" },
      { id: "browsingHistory", label: "Browsing History" },
    ],
  },
  {
    label: "Diagnostics & Usage",
    items: [
      { id: "crashLogs", label: "Crash Logs" },
      { id: "performanceData", label: "Performance Data" },
      { id: "analyticsData", label: "Analytics Data" },
      { id: "diagnostics", label: "Diagnostics" },
    ],
  },
];

export const PERMISSIONS: (CatalogItem & { purpose: string })[] = [
  { id: "camera", label: "Camera", purpose: "to capture photos and videos for features you actively use" },
  { id: "microphone", label: "Microphone", purpose: "to record audio when you use voice or recording features" },
  { id: "location", label: "Location", purpose: "to provide location-based features and content" },
  { id: "contacts", label: "Contacts", purpose: "to help you connect or share with people you know" },
  { id: "storage", label: "Storage / Photos & Media", purpose: "to save and open files, photos, and media on your device" },
  { id: "notifications", label: "Notifications", purpose: "to send you push notifications about updates and activity" },
  { id: "bluetooth", label: "Bluetooth", purpose: "to connect to nearby Bluetooth devices" },
  { id: "nearbyDevices", label: "Nearby Devices", purpose: "to discover and communicate with devices near you" },
  { id: "phone", label: "Phone", purpose: "to support phone-related features such as caller identification" },
  { id: "sms", label: "SMS", purpose: "to verify your phone number or support messaging features" },
  { id: "calendar", label: "Calendar", purpose: "to read or create calendar events for scheduling features" },
  { id: "bodySensors", label: "Body Sensors", purpose: "to read sensor data such as heart rate for health features" },
  { id: "healthConnect", label: "Health Connect", purpose: "to read or write health and fitness data you authorize via Health Connect" },
];

export type ServiceCategory =
  | "platform"
  | "analytics"
  | "crash"
  | "auth"
  | "push"
  | "ads"
  | "maps"
  | "payments"
  | "cloud"
  | "ai"
  | "attribution"
  | "social"
  | "other";

export interface ServiceDef extends CatalogItem {
  category: ServiceCategory;
  url?: string;
}

export const SERVICES: ServiceDef[] = [
  { id: "googlePlayServices", label: "Google Play Services", category: "platform", url: "https://policies.google.com/privacy" },
  { id: "firebaseAnalytics", label: "Firebase Analytics", category: "analytics", url: "https://firebase.google.com/support/privacy" },
  { id: "firebaseCrashlytics", label: "Firebase Crashlytics", category: "crash", url: "https://firebase.google.com/support/privacy" },
  { id: "firebaseAuth", label: "Firebase Authentication", category: "auth", url: "https://firebase.google.com/support/privacy" },
  { id: "fcm", label: "Firebase Cloud Messaging", category: "push", url: "https://firebase.google.com/support/privacy" },
  { id: "googleMaps", label: "Google Maps", category: "maps", url: "https://policies.google.com/privacy" },
  { id: "admob", label: "Google AdMob", category: "ads", url: "https://support.google.com/admob/answer/6128543" },
  { id: "googleSignIn", label: "Google Sign-In", category: "auth", url: "https://policies.google.com/privacy" },
  { id: "googleDrive", label: "Google Drive", category: "cloud", url: "https://policies.google.com/privacy" },
  { id: "googleFit", label: "Google Fit", category: "other", url: "https://policies.google.com/privacy" },
  { id: "revenuecat", label: "RevenueCat", category: "payments", url: "https://www.revenuecat.com/privacy" },
  { id: "stripe", label: "Stripe", category: "payments", url: "https://stripe.com/privacy" },
  { id: "razorpay", label: "Razorpay", category: "payments", url: "https://razorpay.com/privacy/" },
  { id: "paypal", label: "PayPal", category: "payments", url: "https://www.paypal.com/legalhub/privacy-full" },
  { id: "facebookSdk", label: "Facebook SDK", category: "social", url: "https://www.facebook.com/privacy/policy" },
  { id: "metaLogin", label: "Meta Login", category: "auth", url: "https://www.facebook.com/privacy/policy" },
  { id: "appleSignIn", label: "Apple Sign In", category: "auth", url: "https://www.apple.com/legal/privacy/" },
  { id: "onesignal", label: "OneSignal", category: "push", url: "https://onesignal.com/privacy_policy" },
  { id: "mixpanel", label: "Mixpanel", category: "analytics", url: "https://mixpanel.com/legal/privacy-policy/" },
  { id: "appsflyer", label: "AppsFlyer", category: "attribution", url: "https://www.appsflyer.com/legal/services-privacy-policy/" },
  { id: "adjust", label: "Adjust", category: "attribution", url: "https://www.adjust.com/terms/privacy-policy/" },
  { id: "branch", label: "Branch", category: "attribution", url: "https://branch.io/policies/privacy-policy/" },
  { id: "supabase", label: "Supabase", category: "cloud", url: "https://supabase.com/privacy" },
  { id: "aws", label: "Amazon Web Services (AWS)", category: "cloud", url: "https://aws.amazon.com/privacy/" },
  { id: "azure", label: "Microsoft Azure", category: "cloud", url: "https://privacy.microsoft.com/privacystatement" },
  { id: "openai", label: "OpenAI", category: "ai", url: "https://openai.com/policies/privacy-policy" },
  { id: "gemini", label: "Google Gemini API", category: "ai", url: "https://policies.google.com/privacy" },
  { id: "anthropic", label: "Anthropic", category: "ai", url: "https://www.anthropic.com/legal/privacy" },
  { id: "custom", label: "Custom / Other Service", category: "other" },
];

export const policySchema = z.object({
  // Step 1 — App Information
  appName: z.string().trim().min(1, "App name is required"),
  developerName: z.string().trim().min(1, "Developer name is required"),
  developerEmail: z.email("Enter a valid email address"),
  website: z.union([z.url("Enter a valid URL (https://…)"), z.literal("")]),
  country: z.string().trim().min(1, "Country is required"),
  companyName: z.string(),
  // Step 2 — App Details
  category: z.enum(APP_CATEGORIES),
  requiresLogin: z.boolean(),
  ageGroup: z.enum(AGE_GROUPS),
  pricing: z.enum(["Free", "Paid"]),
  ads: z.boolean(),
  iap: z.boolean(),
  // Steps 3–5 — selections
  data: z.array(z.string()),
  permissions: z.array(z.string()),
  services: z.array(z.string()),
  // Step 6 — Children
  childDirected: z.boolean(),
  // Step 7 — Policy Options
  retention: z.string().trim().min(1, "Retention period is required"),
  deleteAccount: z.boolean(),
  gdpr: z.boolean(),
  ccpa: z.boolean(),
  coppa: z.boolean(),
  encryption: z.boolean(),
  deletionEmail: z.union([z.email("Enter a valid email address"), z.literal("")]),
  effectiveDate: z.string().min(1, "Effective date is required"),
  lastUpdated: z.string().min(1, "Last-updated date is required"),
});

export type PolicyInput = z.infer<typeof policySchema>;

export const STEP_FIELDS: (keyof PolicyInput)[][] = [
  ["appName", "developerName", "developerEmail", "website", "country", "companyName"],
  ["category", "requiresLogin", "ageGroup", "pricing", "ads", "iap"],
  ["data"],
  ["permissions"],
  ["services"],
  ["childDirected"],
  ["retention", "deleteAccount", "gdpr", "ccpa", "coppa", "encryption", "deletionEmail", "effectiveDate", "lastUpdated"],
];

export function emptyPolicyInput(): PolicyInput {
  const today = new Date().toISOString().slice(0, 10);
  return {
    appName: "",
    developerName: "",
    developerEmail: "",
    website: "",
    country: "",
    companyName: "",
    category: "Other",
    requiresLogin: false,
    ageGroup: "Everyone",
    pricing: "Free",
    ads: false,
    iap: false,
    data: [],
    permissions: [],
    services: [],
    childDirected: false,
    retention: "as long as your account is active or as needed to provide the service",
    deleteAccount: false,
    gdpr: false,
    ccpa: false,
    coppa: false,
    encryption: true,
    deletionEmail: "",
    effectiveDate: today,
    lastUpdated: today,
  };
}
