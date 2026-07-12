import type { PolicyInput } from "./types";

export interface PolicyTemplate {
  id: string;
  label: string;
  description: string;
  values: Partial<PolicyInput>;
}

export const TEMPLATES: PolicyTemplate[] = [
  {
    id: "education",
    label: "Education App",
    description: "Learning app with accounts, analytics, and push reminders",
    values: {
      category: "Education",
      requiresLogin: true,
      ageGroup: "13+",
      data: ["name", "email", "deviceId", "crashLogs", "analyticsData"],
      permissions: ["notifications", "storage"],
      services: ["googlePlayServices", "firebaseAnalytics", "firebaseCrashlytics", "firebaseAuth", "fcm"],
      deleteAccount: true,
      gdpr: true,
    },
  },
  {
    id: "business",
    label: "Business App",
    description: "B2B productivity tool with sign-in and cloud sync",
    values: {
      category: "Business",
      requiresLogin: true,
      ageGroup: "18+",
      data: ["name", "email", "phone", "crashLogs", "analyticsData", "diagnostics"],
      permissions: ["notifications", "storage", "calendar"],
      services: ["googlePlayServices", "firebaseAnalytics", "firebaseAuth", "googleSignIn", "aws"],
      deleteAccount: true,
      gdpr: true,
      ccpa: true,
    },
  },
  {
    id: "ecommerce",
    label: "Ecommerce App",
    description: "Shopping app with payments, ads, and attribution",
    values: {
      category: "Shopping",
      requiresLogin: true,
      ageGroup: "18+",
      iap: true,
      ads: true,
      data: ["name", "email", "phone", "address", "advertisingId", "analyticsData", "crashLogs", "financialInfo"],
      permissions: ["notifications", "location", "storage"],
      services: ["googlePlayServices", "firebaseAnalytics", "fcm", "admob", "stripe", "razorpay", "appsflyer"],
      deleteAccount: true,
      gdpr: true,
      ccpa: true,
    },
  },
  {
    id: "healthcare",
    label: "Healthcare App",
    description: "Health tracking with sensors and Health Connect",
    values: {
      category: "Health",
      requiresLogin: true,
      ageGroup: "18+",
      data: ["name", "email", "dob", "healthData", "crashLogs", "analyticsData"],
      permissions: ["notifications", "bodySensors", "healthConnect", "location"],
      services: ["googlePlayServices", "firebaseAuth", "firebaseCrashlytics", "googleFit"],
      deleteAccount: true,
      gdpr: true,
      encryption: true,
    },
  },
  {
    id: "ai",
    label: "AI App",
    description: "AI assistant sending prompts to model providers",
    values: {
      category: "Productivity",
      requiresLogin: true,
      ageGroup: "13+",
      iap: true,
      data: ["email", "deviceId", "crashLogs", "analyticsData"],
      permissions: ["notifications", "microphone"],
      services: ["googlePlayServices", "firebaseAnalytics", "firebaseAuth", "revenuecat", "openai", "anthropic", "gemini"],
      deleteAccount: true,
      gdpr: true,
      ccpa: true,
    },
  },
  {
    id: "finance",
    label: "Finance App",
    description: "Fintech app with KYC-style data and payments",
    values: {
      category: "Finance",
      requiresLogin: true,
      ageGroup: "18+",
      data: ["name", "email", "phone", "dob", "address", "financialInfo", "deviceId", "crashLogs", "analyticsData"],
      permissions: ["notifications", "phone", "sms"],
      services: ["googlePlayServices", "firebaseAnalytics", "firebaseAuth", "stripe", "paypal"],
      deleteAccount: true,
      gdpr: true,
      ccpa: true,
      encryption: true,
    },
  },
  {
    id: "gaming",
    label: "Gaming App",
    description: "Free-to-play game with ads and in-app purchases",
    values: {
      category: "Entertainment",
      ageGroup: "Everyone",
      ads: true,
      iap: true,
      data: ["deviceId", "advertisingId", "crashLogs", "performanceData", "analyticsData"],
      permissions: ["notifications"],
      services: ["googlePlayServices", "firebaseAnalytics", "firebaseCrashlytics", "admob", "appsflyer"],
      gdpr: true,
      ccpa: true,
    },
  },
];
