import { getSiteSettings } from "@/lib/data/site";
import { HeroSection } from "@/components/sections/hero-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";
import { InteractiveDemoSection } from "@/components/sections/interactive-demo-section";
import { PlatformSection } from "@/components/sections/platform-section";
import { TrustSection } from "@/components/sections/trust-section";
import { AudienceSection } from "@/components/sections/audience-section";

export default async function Home() {
  const settings = await getSiteSettings();

  return (
    <div className="home-atmosphere relative isolate overflow-hidden">
      <HeroSection calendlyUrl={settings.calendlyUrl} />
      <PlatformSection />
      <InteractiveDemoSection calendlyUrl={settings.calendlyUrl} />
      <TrustSection />
      <AudienceSection />
      <FinalCtaSection calendlyUrl={settings.calendlyUrl} />
    </div>
  );
}
