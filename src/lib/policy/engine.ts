import {
  DATA_GROUPS,
  PERMISSIONS,
  SERVICES,
  type PolicyInput,
  type ServiceCategory,
} from "./types";

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function listSentence(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function generatePolicy(input: PolicyInput): string {
  const selectedServices = SERVICES.filter((s) => input.services.includes(s.id));
  const byCategory = (...cats: ServiceCategory[]) =>
    selectedServices.filter((s) => cats.includes(s.category));

  const analyticsServices = byCategory("analytics", "attribution", "crash");
  const adServices = byCategory("ads");
  const authServices = byCategory("auth");
  const pushServices = byCategory("push");
  const paymentServices = byCategory("payments");
  const aiServices = byCategory("ai");

  const has = (id: string) => input.data.includes(id);
  const hasPermission = (id: string) => input.permissions.includes(id);
  const collectsLocation = has("approxLocation") || has("preciseLocation") || hasPermission("location");
  const usesAds = input.ads || adServices.length > 0;
  const usesPayments = input.iap || input.pricing === "Paid" || paymentServices.length > 0;
  const usesPush = pushServices.length > 0 || hasPermission("notifications");
  const collectsAnything = input.data.length > 0 || input.requiresLogin;

  const entity = input.companyName || input.developerName;
  const contactEmail = input.developerEmail;
  const deletionEmail = input.deletionEmail || contactEmail;

  const sections: string[] = [];
  const add = (heading: string, ...paragraphs: string[]) =>
    sections.push(`## ${heading}\n\n${paragraphs.filter(Boolean).join("\n\n")}`);

  // Header
  sections.push(
    `# Privacy Policy for ${input.appName}`,
    `**Effective Date:** ${formatDate(input.effectiveDate)}\n**Last Updated:** ${formatDate(input.lastUpdated)}`
  );

  // 1. Introduction
  add(
    "Introduction",
    `${entity} ("we", "us", or "our") operates the **${input.appName}** mobile application (the "App"), a ${input.pricing.toLowerCase()} ${input.category.toLowerCase() === "other" ? "" : `${input.category.toLowerCase()} `}app available on the Google Play Store. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the App.`,
    `By downloading, installing, or using the App, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with the terms of this policy, please do not use the App.`
  );

  // 2. Information We Collect
  {
    const paras: string[] = [];
    if (!collectsAnything) {
      paras.push(
        `**${input.appName} does not collect any personal information.** The App is designed to work without gathering data about you. Any content you create within the App stays on your device unless you explicitly choose to share it.`
      );
    } else {
      paras.push(`We collect the following types of information when you use the App:`);
      for (const group of DATA_GROUPS) {
        const picked = group.items.filter((i) => has(i.id));
        if (picked.length > 0) {
          paras.push(`**${group.label}**\n${picked.map((i) => `- ${i.label}`).join("\n")}`);
        }
      }
      if (input.requiresLogin) {
        paras.push(
          `**Account Information.** The App requires you to create an account or sign in. When you register, we collect the credentials and profile details you provide${authServices.length > 0 ? `, and if you sign in through a third-party provider (${listSentence(authServices.map((s) => s.label))}), we receive basic profile information that provider makes available, such as your name and email address` : ""}.`
        );
      }
      paras.push(
        `We collect this information directly when you provide it, and automatically through the App and integrated third-party software development kits (SDKs) as you use it.`
      );
    }
    add("Information We Collect", ...paras);
  }

  // 3. How We Use Your Information
  {
    const uses: string[] = [
      "To provide, operate, and maintain the App and its core features",
      "To improve, personalize, and expand the App",
    ];
    if (input.requiresLogin) uses.push("To create and manage your account and authenticate you");
    if (analyticsServices.length > 0 || has("analyticsData") || has("performanceData"))
      uses.push("To understand how you use the App and to analyze usage trends");
    if (has("crashLogs") || has("diagnostics"))
      uses.push("To diagnose crashes, monitor performance, and fix bugs");
    if (usesPush) uses.push("To send you push notifications about updates, activity, and relevant information (you can opt out in your device settings)");
    if (usesAds) uses.push("To display advertising, including ads tailored to your interests where permitted");
    if (usesPayments) uses.push("To process purchases, subscriptions, and payments");
    if (collectsLocation) uses.push("To provide location-based features and content");
    if (aiServices.length > 0) uses.push("To provide AI-powered features by processing your inputs through the AI providers listed below");
    uses.push(
      "To communicate with you, including responding to your support requests",
      "To comply with legal obligations and enforce our terms"
    );
    add("How We Use Your Information", "We use the information we collect for the following purposes:", uses.map((u) => `- ${u}`).join("\n"));
  }

  // 4. Data Sharing and Disclosure
  add(
    "Data Sharing and Disclosure",
    `We do not sell your personal information. We may share information in the following limited circumstances:`,
    [
      `- **Service providers.** With third-party vendors and SDK providers listed in this policy who perform services on our behalf (such as ${listSentence(
        [
          analyticsServices.length > 0 ? "analytics" : "",
          usesAds ? "advertising" : "",
          usesPayments ? "payment processing" : "",
          usesPush ? "push notification delivery" : "",
          "hosting and infrastructure",
        ].filter(Boolean)
      )}).`,
      `- **Legal requirements.** When required by law, regulation, legal process, or governmental request, or to protect the rights, property, or safety of ${entity}, our users, or others.`,
      `- **Business transfers.** In connection with a merger, acquisition, or sale of assets, in which case this policy will continue to apply to your information.`,
      `- **With your consent.** For any other purpose disclosed to you at the time we collect the information, with your consent.`,
    ].join("\n")
  );

  // 5. Third-Party Services
  if (selectedServices.length > 0) {
    const rows = selectedServices.map((s) =>
      s.url
        ? `- **${s.label}** — [Privacy Policy](${s.url})`
        : `- **${s.label}**`
    );
    const paras = [
      `The App uses the following third-party services, which may collect information used to identify you. We encourage you to review the privacy policy of each provider:`,
      rows.join("\n"),
    ];
    if (analyticsServices.length > 0)
      paras.push(
        `**Analytics.** We use ${listSentence(analyticsServices.map((s) => s.label))} to collect usage and diagnostic data such as how often the App is used, which features are popular, and crash reports. This data is aggregated and helps us improve the App.`
      );
    if (adServices.length > 0)
      paras.push(
        `**Advertising.** We use ${listSentence(adServices.map((s) => s.label))} to serve advertisements in the App. Ad providers may use identifiers such as your Advertising ID to show ads that are more relevant to you. You can reset your Advertising ID or opt out of personalized ads at any time in your device's Google settings (Settings → Google → Ads).`
      );
    if (paymentServices.length > 0 || input.iap)
      paras.push(
        `**Payments.** ${paymentServices.length > 0 ? `Payments are processed by ${listSentence(paymentServices.map((s) => s.label))}${input.iap ? " and Google Play Billing" : ""}` : "In-app purchases are processed by Google Play Billing"}. We do not collect or store your full payment card details — payment information is handled directly by the payment processor under its own privacy policy.`
      );
    if (aiServices.length > 0)
      paras.push(
        `**AI Processing.** Some features send the content you submit (such as text prompts) to ${listSentence(aiServices.map((s) => s.label))} for processing. We only share what is necessary to provide the feature, and we do not permit these providers to use your content for advertising.`
      );
    add("Third-Party Services", ...paras);
  } else {
    add(
      "Third-Party Services",
      `The App does not integrate third-party SDKs or services that collect your personal information.`
    );
  }

  // 6. Android Permissions
  if (input.permissions.length > 0) {
    const rows = PERMISSIONS.filter((p) => input.permissions.includes(p.id)).map(
      (p) => `- **${p.label}** — used ${p.purpose}.`
    );
    add(
      "Android Permissions",
      `The App requests the following Android permissions. Each permission is used only for the purpose described, and you can revoke permissions at any time in your device settings (Settings → Apps → ${input.appName} → Permissions):`,
      rows.join("\n")
    );
  }

  // 7. Security
  add(
    "Data Security",
    [
      `We take the security of your information seriously and use commercially reasonable administrative, technical, and physical safeguards to protect it.`,
      input.encryption
        ? ` Data transmitted between the App and our servers is encrypted in transit using industry-standard protocols (such as TLS/HTTPS), and sensitive data is encrypted at rest.`
        : "",
      ` However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.`,
    ].join("")
  );

  // 8. Children's Privacy
  if (input.childDirected || input.coppa) {
    add(
      "Children's Privacy",
      `${input.childDirected ? `The App is directed to children under the age of 13, and we comply` : `We comply`} with the Children's Online Privacy Protection Act (COPPA) and the Google Play Families Policy. We do not knowingly collect more personal information from children than is reasonably necessary to provide the App${usesAds ? ", and any advertising shown to children uses only ad products certified for family audiences with personalized advertising disabled" : ""}.`,
      `Parents and guardians may review the information collected from their child, request its deletion, and refuse further collection by contacting us at ${contactEmail}. We will delete a child's personal information promptly upon a verified request.`
    );
  } else {
    const minAge = input.ageGroup === "Everyone" ? "13" : input.ageGroup.replace("+", "");
    add(
      "Children's Privacy",
      `The App is not directed to children under ${minAge}, and we do not knowingly collect personal information from children under ${minAge}. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at ${contactEmail} and we will promptly delete it.`
    );
  }

  // 9. Data Retention
  add(
    "Data Retention",
    `We retain your information ${input.retention}. When information is no longer needed for the purposes described in this policy, we delete it or anonymize it. Aggregated, non-identifiable data may be retained for analytics purposes.`
  );

  // 10. Your Rights
  {
    const paras: string[] = [
      `Depending on where you live, you may have the following rights regarding your personal information: the right to access the data we hold about you, to correct inaccurate data, to request deletion, to object to or restrict certain processing, and to data portability. To exercise any of these rights, contact us at ${contactEmail}. We will respond within the timeframe required by applicable law.`,
    ];
    if (input.gdpr)
      paras.push(
        `**European Users (GDPR).** If you are located in the European Economic Area, the United Kingdom, or Switzerland, we process your personal data under the legal bases of consent, performance of a contract, and legitimate interests. You additionally have the right to withdraw consent at any time and to lodge a complaint with your local supervisory authority.`
      );
    if (input.ccpa)
      paras.push(
        `**California Users (CCPA/CPRA).** If you are a California resident, you have the right to know what personal information we collect, the right to request deletion, the right to correct inaccurate information, and the right to opt out of the sale or sharing of personal information. We do not sell personal information as defined by the CCPA. We will not discriminate against you for exercising these rights.`
      );
    add("Your Rights", ...paras);
  }

  // 11. Account & Data Deletion
  if (input.requiresLogin || input.deleteAccount || input.deletionEmail) {
    add(
      "Account and Data Deletion",
      [
        input.deleteAccount
          ? `You can delete your account directly within the App${input.requiresLogin ? " from your account settings" : ""}, which removes your personal information from our systems. `
          : "",
        `You may also request deletion of your account and associated data at any time by emailing **${deletionEmail}** with the subject line "Data Deletion Request". We will verify and complete your request within 30 days, except where we are required to retain certain data for legal or security purposes.`,
      ].join("")
    );
  }

  // 12. Cookies and Tracking Technologies
  add(
    "Cookies and Similar Technologies",
    usesAds || analyticsServices.length > 0
      ? `The App itself does not use browser cookies, but the third-party SDKs it integrates may use device identifiers, local storage, and similar technologies to recognize your device, remember preferences, measure performance, and${usesAds ? " deliver and measure advertising" : " analyze usage"}. You can limit tracking through your device settings, including resetting your Advertising ID.`
      : `The App does not use cookies. If you access related web content through the App, standard web technologies such as local storage may be used solely to make those pages function.`
  );

  // 13. International Data Transfers
  add(
    "International Data Transfers",
    `We are based in ${input.country}, and the information we collect may be processed on servers located outside your state, province, or country, where data protection laws may differ. Where required, we use appropriate safeguards (such as standard contractual clauses) for such transfers, and by using the App you consent to this processing.`
  );

  // 14. Changes to This Privacy Policy
  add(
    "Changes to This Privacy Policy",
    `We may update this Privacy Policy from time to time. We will post the updated policy on this page, update the "Last Updated" date above, and, for material changes, provide additional notice within the App. Your continued use of the App after changes take effect constitutes acceptance of the revised policy.`
  );

  // 15. Contact Us
  add(
    "Contact Us",
    `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, contact us:`,
    [
      `- **Developer:** ${input.developerName}`,
      input.companyName ? `- **Company:** ${input.companyName}` : "",
      `- **Email:** ${contactEmail}`,
      input.website ? `- **Website:** ${input.website}` : "",
      `- **Country:** ${input.country}`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return sections.join("\n\n");
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>');
}

/** Minimal converter for the subset of markdown the engine emits: #/##, **bold**, [links](…), "- " lists, paragraphs with line breaks. Input is HTML-escaped first. */
export function markdownToHtml(markdown: string): string {
  const blocks = escapeHtml(markdown).split(/\n{2,}/);
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("# ")) return `<h1>${inline(trimmed.slice(2))}</h1>`;
      if (trimmed.startsWith("## ")) return `<h2>${inline(trimmed.slice(3))}</h2>`;
      const lines = trimmed.split("\n");
      const html: string[] = [];
      let list: string[] = [];
      let para: string[] = [];
      const flushList = () => {
        if (list.length) html.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`);
        list = [];
      };
      const flushPara = () => {
        if (para.length) html.push(`<p>${para.map(inline).join("<br />")}</p>`);
        para = [];
      };
      for (const line of lines) {
        if (line.startsWith("- ")) {
          flushPara();
          list.push(line.slice(2));
        } else {
          flushList();
          para.push(line);
        }
      }
      flushList();
      flushPara();
      return html.join("\n");
    })
    .filter(Boolean)
    .join("\n");
}

/** Standalone, styled HTML document — used for the HTML download and print/PDF. */
export function policyHtmlDocument(markdown: string, appName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Privacy Policy — ${escapeHtml(appName)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #1f2937; max-width: 760px; margin: 0 auto; padding: 48px 24px; }
  h1 { font-size: 1.9rem; line-height: 1.3; }
  h2 { font-size: 1.3rem; margin-top: 2.2em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
  a { color: #4f46e5; }
  li { margin: 0.35em 0; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
${markdownToHtml(markdown)}
</body>
</html>
`;
}
