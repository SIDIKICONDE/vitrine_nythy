import { AppCheckInitializer } from "@/components/AppCheckInitializer";
import { RecaptchaScriptLoader } from "@/components/RecaptchaScriptLoader";
import { getNonceFromHeaders } from "@/lib/security/csp-nonce";
import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

// Configuration de la police Bebas Neue (Google Fonts)
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
  fallback: ["system-ui", "arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Vitrine - Application Web Moderne",
  description: "Une application web moderne et performante construite avec Next.js, React et Tailwind CSS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const recaptchaSiteKey = process.env['NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY'];
  const headersList = await headers();
  const nonce = getNonceFromHeaders(headersList);

  return (
    <html lang="fr">
      <body
        className={`${bebasNeue.variable} font-sans antialiased`}
      >
        {/* Load reCAPTCHA Enterprise API */}
        {recaptchaSiteKey && <RecaptchaScriptLoader siteKey={recaptchaSiteKey} nonce={nonce} />}
        <AppCheckInitializer />
        {children}
      </body>
    </html>
  );
}
