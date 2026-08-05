import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Lenis from 'lenis';

import { MarketingNav } from '../components/Marketing/MarketingNav';
import { MarketingHero } from '../components/Marketing/MarketingHero';
import { MarketingSplitFeatures } from '../components/Marketing/MarketingSplitFeatures';
import { MarketingBentoGrid } from '../components/Marketing/MarketingBentoGrid';
import { AdminFeatureShowcase } from '../components/Marketing/AdminFeatureShowcase';
import { MarketingFooter } from '../components/Marketing/MarketingFooter';

export const MarketingPage: React.FC = () => {

  useEffect(() => {
    // Initialize Animate On Scroll
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
      offset: 50,
    });

    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-inter text-[#1d1d1f] selection:bg-[#FF3366]/20 selection:text-[#FF3366]">
      <MarketingNav />
      <MarketingHero />
      <MarketingSplitFeatures />
      <MarketingBentoGrid />
      <AdminFeatureShowcase />
      <MarketingFooter />
    </div>
  );
};