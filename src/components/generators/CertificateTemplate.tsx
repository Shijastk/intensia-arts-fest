import React from 'react';
import type { TemplateConfig } from '../../services/backgroundService';
import {
  A4_PX,
  TEMPLATE_DEFAULTS,
  autoFitBlockFontSize,
  autoFitFontSize,
  applyTextCase,
  fillPlaceholders,
  fontStack,
  flexAlign,
  parseRichText,
  resolveCertificateFestText,
  type FestDetails,
  resolvePlacement,
  resolveTextRoles,
  stripRichMarkers,
} from '../../services/exportService';
import { TemplateBackground } from './TemplateBackground';

interface CertificateTemplateProps {
  backgroundUrl: string;
  participantName: string;
  chestNo: string;
  team: string;
  category: string;
  events: string[];
  bgPositionX?: number;
  bgPositionY?: number;
  bgScale?: number;
  festName?: string;
  /** Fest venue / dates from Settings; a value typed in the design overrides them. */
  fest?: FestDetails;
  position?: string;
  grade?: string;
  /** Merged template config (exportService.pickTemplate / mergeTemplateConfig). Missing fields use today's defaults. */
  config?: TemplateConfig;
}

const D = TEMPLATE_DEFAULTS.certificateBgs;

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  backgroundUrl,
  participantName,
  chestNo,
  team,
  category,
  events,
  bgPositionX,
  bgPositionY,
  bgScale,
  festName = "ARTS FEST",
  fest,
  position,
  grade,
  config = {}
}) => {
  const c: TemplateConfig = config;
  const textAlign = c.textAlign ?? D.textAlign!;
  const alignItems = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start';
  const accent = c.secondaryColor ?? D.secondaryColor!;
  const titleSize = c.titleFontSize ?? D.titleFontSize!;
  const bodySize = c.bodyFontSize ?? D.bodyFontSize!;
  const letterSpacing = c.letterSpacing ?? D.letterSpacing!;
  const lineHeight = c.lineHeight ?? D.lineHeight!;
  // Unset textColor keeps the original per-line colours (gray-600 / gray-700 / black).
  const detailsColor = c.textColor ?? '#4b5563';
  const bodyColor = c.textColor ?? '#374151';
  const strongColor = c.textColor ?? '#000000';

  const roles = resolveTextRoles('certificateBgs', c);
  const name = applyTextCase(participantName, roles.name.textCase);
  // Spacing is a % of the page (top: height, sides: width).
  const { top: contentTop, pad, position: blockPos, widthPct } = resolvePlacement('certificateBgs', c);
  const innerWidth = ((A4_PX.width - pad.left - pad.right) * widthPct) / 100;

  // Name: shrink with length (~0.68em per uppercase glyph + tracking), wrap to at most 2 lines.
  const nameCharsAtBase = Math.max(8, Math.floor(innerWidth / (titleSize * (0.68 + letterSpacing))));
  const nameSize = autoFitFontSize(name, titleSize, { charsPerLineAtBase: nameCharsAtBase });
  const nameLineHeight = nameSize === titleSize ? 1 : 1.1;

  const body = fillPlaceholders(c.bodyTemplate ?? D.bodyTemplate!, {
    name: participantName,
    chestNo,
    team,
    events: (events || []).join(', '),
    category,
    festName,
    position,
    grade,
    ...resolveCertificateFestText(c, fest),
  });
  // Centred layouts keep the original inner insets (details px-12, body px-24); left/right aligned
  // text lines up exactly with the name on the aligned edge, so the insets are dropped there.
  const centred = textAlign === 'center';
  const detailsInset = centred ? 'px-12' : '';
  const bodyInset = centred ? 'px-24' : '';
  // Body block: ~0.5em per glyph, up to 8 lines before shrinking.
  const bodyWidth = Math.max(200, innerWidth - (centred ? 192 : 0));
  const bodyCapacity = Math.floor(bodyWidth / (bodySize * 0.5)) * 8;
  const bodyFitSize = autoFitBlockFontSize(stripRichMarkers(body), bodySize, bodyCapacity, 10);

  return (
    <div
      className="relative w-[794px] h-[1123px] bg-white mx-auto overflow-hidden shadow-xl"
      style={{ fontFamily: fontStack(c.bodyFontFamily ?? D.bodyFontFamily) }}
    >
      <TemplateBackground url={backgroundUrl} bgScale={bgScale ?? c.bgScale} bgPositionX={bgPositionX ?? c.bgPositionX} bgPositionY={bgPositionY ?? c.bgPositionY} />

      {/* Content wrapper to position elements relative to the design */}
      <div
        className="absolute inset-0 flex flex-col justify-center"
        style={{ paddingTop: `${contentTop}px`, paddingLeft: `${pad.left}px`, paddingRight: `${pad.right}px`, alignItems: flexAlign(blockPos) }}
      >
        {/* The block sits at its page position; its lines are aligned inside it. */}
        <div className="flex flex-col" style={{ width: 'fit-content', maxWidth: `${widthPct}%`, alignItems, textAlign }}>
        {/* Name */}
        <h1
          className="mb-4 max-w-full"
          style={{
            color: accent,
            fontFamily: fontStack(roles.name.font),
            fontWeight: c.fontWeight ?? D.fontWeight,
            fontSize: `${nameSize}px`,
            lineHeight: nameLineHeight,
            letterSpacing: `${letterSpacing}em`,
            overflowWrap: 'anywhere',
            maxHeight: `${nameSize * nameLineHeight * 2}px`,
            overflow: 'hidden',
          }}
        >
          {name}
        </h1>

        {/* Details Row */}
        <p
          className={`mb-10 ${detailsInset} max-w-full`}
          style={{ color: detailsColor, fontSize: `${bodySize}px`, lineHeight, letterSpacing: '0.025em' }}
        >
          Chest No. {chestNo} &middot; <span style={{ fontFamily: fontStack(roles.team.font) }}>{applyTextCase(team, roles.team.textCase)}</span>{category ? <> &middot; <span className="whitespace-nowrap">{category}</span></> : null}
        </p>

        {/* Participated Events Text */}
        <div className={`${bodyInset} max-w-full`} style={{ color: bodyColor, fontSize: `${bodyFitSize}px`, lineHeight, overflowWrap: 'anywhere' }}>
          {parseRichText(body).map((line, li) => (
            <React.Fragment key={li}>
              {li > 0 && <br />}
              {line.map((seg, si) =>
                seg.bold
                  ? <span key={si} className="font-bold" style={seg.strong ? { color: strongColor } : undefined}>{seg.text}</span>
                  : <React.Fragment key={si}>{seg.text}</React.Fragment>
              )}
            </React.Fragment>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
};
