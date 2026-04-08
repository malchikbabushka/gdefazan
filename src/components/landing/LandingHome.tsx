"use client";

import { LandingHero } from "./LandingHero";
import { CategoryTiles } from "./CategoryTiles";
import { LeadersSection } from "./LeadersSection";
import { SuppliersSection } from "./SuppliersSection";
import { AboutSection } from "./AboutSection";

export function LandingHome() {
  return (
    <div className="w-full">
      <LandingHero />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CategoryTiles />
        <LeadersSection />
        <AboutSection />
        <SuppliersSection />
      </div>
    </div>
  );
}

