import type { Metadata } from "next";
import localFont from "next/font/local";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/lib/data/site";
import type { SiteSettings } from "@/types";
import { SiteChrome } from "@/components/layout/site-chrome";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
});

const defaultTitle = `${siteConfig.name} — Cloud Cost and Infrastructure Intelligence`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: defaultTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  // No title, description or URL here: a page that doesn't set its own
  // `openGraph` inherits this one, and Next fills both cards from that page's
  // title and description — so shares never show the home page's.
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Only factual, verifiable fields — nothing invented (no address, founders,
// etc.). `sameAs` lists only the profiles configured in the site settings.
// The WebSite entry gives search engines the site's name for results.
function structuredData(settings: SiteSettings) {
  const organizationId = `${siteConfig.url}/#organization`;
  const sameAs = [settings.social.linkedin, settings.social.github].filter(
    (url): url is string => Boolean(url),
  );
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/dilanix-logo.png`,
        description: siteConfig.description,
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        publisher: { "@id": organizationId },
      },
    ],
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData(settings)),
          }}
        />
        <ThemeProvider>
          <SiteChrome
            links={settings.nav}
            calendlyUrl={settings.calendlyUrl}
            settings={settings}
          >
            {children}
          </SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
