'use client';

import React, { useEffect } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

/**
 * Reusable AdSense Banner Component
 * 
 * IMPORTANT FOR MONETIZATION:
 * 1. Custom Domain: AdSense typically requires a custom domain (e.g., mathwhiz.com) for approval.
 * 2. Ads.txt: Once approved, you must place your 'ads.txt' file in the /public folder.
 * 3. Publisher ID: Replace 'ca-pub-XXXXXXXXXXXXXXXX' with your actual AdSense Publisher ID.
 */
export function AdBanner({ slot, format = 'auto', className = "" }: AdBannerProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // Silently fail if ads are blocked or script not loaded
    }
  }, []);

  return (
    <div className={`w-full overflow-hidden flex justify-center bg-muted/30 rounded-lg border border-dashed border-muted-foreground/10 p-2 min-h-[90px] relative ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // REPLACE WITH YOUR ADSENSE PUB ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      {/* Visual indicator for development/testing */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Ad Space</span>
      </div>
    </div>
  );
}
