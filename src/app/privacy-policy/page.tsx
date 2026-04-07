import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | MegaYours",
  description: "MegaYours privacy policy.",
};

const sections = [
  {
    title: "1. Introduction",
    body: [
      'Welcome to MegaYours ("we", "our", "us").',
      "This Privacy Policy explains how we collect, use, and protect your information when you use our services.",
      "MegaYours is a brand monitoring and intellectual property protection tool designed to help users review and manage their own presence on Pinterest.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "a. Information you provide",
      "Any information you submit while using the service",
      "b. Pinterest account data (if connected)",
      "If you choose to connect your Pinterest account via OAuth, we may access:",
      "Pins and related metadata associated with your account",
      "Other data explicitly permitted by Pinterest's API",
      "We do not collect or store your Pinterest password.",
      "c. Automatically collected data",
      "Basic usage analytics (to improve the service)",
    ],
  },
  {
    title: "3. How We Use Your Information",
    body: [
      "We use your information to:",
      "Provide brand monitoring and IP protection features",
      "Allow you to review content related to your own assets",
      "Improve functionality and user experience",
      "Ensure compliance with applicable laws and platform policies",
      "We only use Pinterest data to provide services to the same user who authorized access.",
    ],
  },
  {
    title: "4. Data Storage and Retention",
    body: [
      "We do not store Pinterest data longer than necessary to provide the service",
      "Where possible, data is accessed dynamically via API calls",
      "Any temporary data is securely stored and periodically deleted",
      "We retain user account data only as long as needed for service operation or legal obligations.",
    ],
  },
  {
    title: "5. Data Sharing",
    body: [
      "We do not sell, rent, or trade your personal data.",
      "We do not share Pinterest data with third parties, except:",
      "When required by law",
      "To comply with legal obligations",
      "With service providers strictly necessary to operate the app (e.g. hosting), under confidentiality agreements",
      "We do not use Pinterest data for advertising outside Pinterest.",
    ],
  },
  {
    title: "6. User Control and Rights",
    body: [
      "You have the right to:",
      "Disconnect your Pinterest account at any time",
      "Request deletion of your data",
      "Access or correct your personal information",
      "To make a request, contact: hello@megayours.com and info@megayours.com",
    ],
  },
  {
    title: "7. Security",
    body: [
      "We implement appropriate technical and organizational measures to protect your data, including:",
      "Secure authentication (OAuth, Passkey)",
      "Encryption where applicable",
      "Restricted access to sensitive data",
    ],
  },
  {
    title: "8. Third-Party Services",
    body: [
      "Our service integrates with Pinterest via its official API.",
      "Your use of Pinterest remains subject to Pinterest's own terms and policies.",
    ],
  },
  {
    title: "9. Children's Privacy",
    body: [
      "Our service is not intended for children under 13, and we do not knowingly collect data from them.",
    ],
  },
  {
    title: "10. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time.",
      "We will notify users of significant changes via our website or service.",
    ],
  },
  {
    title: "11. Contact",
    body: [
      "If you have any questions about this Privacy Policy, contact us at:",
      "hello@megayours.com",
      "megayours.com",
    ],
  },
];

const isStandaloneLine = (line: string) =>
  /^[abc]\./.test(line) ||
  [
    "Pins and related metadata associated with your account",
    "Other data explicitly permitted by Pinterest's API",
    "Provide brand monitoring and IP protection features",
    "Allow you to review content related to your own assets",
    "Improve functionality and user experience",
    "Ensure compliance with applicable laws and platform policies",
    "Where possible, data is accessed dynamically via API calls",
    "Any temporary data is securely stored and periodically deleted",
    "When required by law",
    "To comply with legal obligations",
    "With service providers strictly necessary to operate the app (e.g. hosting), under confidentiality agreements",
    "Disconnect your Pinterest account at any time",
    "Request deletion of your data",
    "Access or correct your personal information",
    "Secure authentication (OAuth, Passkey)",
    "Encryption where applicable",
    "Restricted access to sensitive data",
    "hello@megayours.com",
    "megayours.com",
  ].includes(line);

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/10 px-6 pb-20 pt-32">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-border/60 bg-card/90 p-8 shadow-sm backdrop-blur md:p-12">
          <header className="border-b border-border/60 pb-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Privacy Policy
            </p>
            <h1 className="mt-3 text-4xl text-primary md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Last updated: 7/4/2026
            </p>
          </header>

          <div className="mt-8 space-y-8 text-base leading-8 text-foreground/90">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl text-primary">{section.title}</h2>
                <div className="mt-4 space-y-3">
                  {section.body.map((line) => (
                    <p
                      key={`${section.title}-${line}`}
                      className={
                        isStandaloneLine(line) ? "pl-4 text-foreground/85" : ""
                      }
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
