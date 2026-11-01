import React from 'react';
import type { TemplateConfig } from '../../services/backgroundService';
import { TEMPLATE_DEFAULTS, applyTextCase, fontStack, resolvePlacement, resolveTextRoles } from '../../services/exportService';
import { TemplateBackground } from './TemplateBackground';

export interface WinnerDetails {
  place: 1 | 2 | 3;
  name: string;
  team: string;
  /** Unique key; tied winners share a place. */
  id?: string;
}

interface PosterTemplateProps {
  backgroundUrl: string;
  eventName: string;
  category: string;
  winners: WinnerDetails[];
  contentTop?: number;
  contentLeft?: number;
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  secondaryColor?: string;
  posterSize?: 'portrait' | 'square';
  bgPositionX?: number;
  bgPositionY?: number;
  bgScale?: number;
  /** Merged template config; explicit props above win over it. */
  config?: TemplateConfig;
}

const D = TEMPLATE_DEFAULTS.posterBgs;

export const PosterTemplate: React.FC<PosterTemplateProps> = ({
  backgroundUrl,
  eventName,
  category,
  winners,
  contentTop,
  contentLeft,
  textAlign,
  textColor,
  secondaryColor,
  posterSize,
  bgPositionX,
  bgPositionY,
  bgScale,
  config = {}
}) => {
  const c: TemplateConfig = config;
  const align = textAlign ?? c.textAlign ?? D.textAlign!;
  const primary = textColor ?? c.textColor ?? D.textColor!;
  const accent = secondaryColor ?? c.secondaryColor ?? D.secondaryColor!;
  const size = posterSize ?? c.posterSize ?? D.posterSize;
  const titleSize = c.titleFontSize ?? D.titleFontSize!;
  const bodySize = c.bodyFontSize ?? D.bodyFontSize!;
  const k = bodySize / 30; // secondary text scales with the winner-name size
  const letterSpacing = c.letterSpacing ?? D.letterSpacing!;
  const lineHeight = c.lineHeight ?? D.lineHeight!;
  const alignItems = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  // Spacing is a % of the page, so it scales with the poster size (portrait or square).
  const { top, pad } = resolvePlacement('posterBgs', { ...c, textAlign: align, posterSize: size }, { contentTop, contentLeft });
  const roles = resolveTextRoles('posterBgs', c);

  // Copy before sorting (props must not be mutated); stable for tied places.
  const sortedWinners = (winners || []).map((w, i) => ({ w, i })).sort((a, b) => a.w.place - b.w.place || a.i - b.i);

  return (
    <div
      className={`relative w-[1080px] ${size === 'square' ? 'h-[1080px]' : 'h-[1350px]'} bg-white mx-auto overflow-hidden shadow-xl`}
      style={{ fontFamily: fontStack(c.bodyFontFamily ?? D.bodyFontFamily) }}
    >
      <TemplateBackground url={backgroundUrl} bgScale={bgScale ?? c.bgScale} bgPositionX={bgPositionX ?? c.bgPositionX} bgPositionY={bgPositionY ?? c.bgPositionY} />

      {/* Content wrapper */}
      <div
        className="absolute inset-0 flex flex-col justify-start"
        style={{
          paddingTop: `${top}px`,
          paddingLeft: `${pad.left}px`,
          paddingRight: `${pad.right}px`,
          alignItems: alignItems,
          textAlign: align
        }}
      >
        {/* Event Title */}
        <h1
          className="mb-8 break-words max-w-full"
          style={{
            color: primary,
            fontFamily: fontStack(roles.title.font),
            fontWeight: c.fontWeight ?? D.fontWeight,
            fontSize: `${titleSize}px`,
            lineHeight: 1,
            letterSpacing: `${letterSpacing}em`,
          }}
        >
          {applyTextCase(eventName, roles.title.textCase)}
        </h1>

        {/* Category */}
        <h2 className="font-bold uppercase tracking-[0.2em] mb-12 break-words max-w-full" style={{ color: accent, fontSize: `${20 * k}px`, lineHeight: 1.4 }}>
          {category}
        </h2>

        {/* Winners List */}
        <div className="space-y-8 flex flex-col w-full" style={{ alignItems: alignItems }}>
          {sortedWinners.map(({ w: winner, i }) => (
            <div key={winner.id ?? `${winner.place}-${winner.name}-${i}`} className="flex flex-col" style={{ alignItems: alignItems }}>
              <span className="font-bold uppercase tracking-widest mb-1 break-words max-w-full" style={{ color: accent, fontSize: `${14 * k}px`, lineHeight: 20 / 14 }}>
                {winner.place}{winner.place === 1 ? 'ST' : winner.place === 2 ? 'ND' : 'RD'} PLACE
              </span>
              <span className="font-black mb-1 break-words max-w-full" style={{ color: primary, fontFamily: fontStack(roles.name.font), fontSize: `${bodySize}px`, lineHeight }}>
                {applyTextCase(winner.name, roles.name.textCase)}
              </span>
              {winner.team && (
                <span className="tracking-wider break-words max-w-full" style={{ color: primary, opacity: 0.8, fontFamily: fontStack(roles.team.font), fontSize: `${14 * k}px`, lineHeight: 20 / 14 }}>
                  {applyTextCase(winner.team, roles.team.textCase)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
