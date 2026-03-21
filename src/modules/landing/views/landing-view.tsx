import { LandingCommunity } from "@/modules/landing/components/landing-community";
import { LandingFooter } from "@/modules/landing/components/landing-footer";
import { LandingHero } from "@/modules/landing/components/landing-hero";
import { LandingNav } from "@/modules/landing/components/landing-nav";
import { LandingPillars } from "@/modules/landing/components/landing-pillars";
import { LandingPrograms } from "@/modules/landing/components/landing-programs";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";

type LandingViewProps = {
  textMap: LandingTextMap;
};

export function LandingView({ textMap }: LandingViewProps) {
  return (
    <div className="min-h-screen bg-[#f4efe5] text-black">
      <LandingNav />
      <LandingHero textMap={textMap} />
      <LandingPillars textMap={textMap} />
      <LandingPrograms textMap={textMap} />
      <LandingCommunity textMap={textMap} />
      <LandingFooter textMap={textMap} />
    </div>
  );
}
