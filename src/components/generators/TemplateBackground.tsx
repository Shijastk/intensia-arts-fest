import React from 'react';
import { computeBackgroundBox } from '../../services/exportService';

interface TemplateBackgroundProps {
  url?: string;
  bgScale?: number;
  bgPositionX?: number;
  bgPositionY?: number;
}

/**
 * Background layer used by every generator template. Rendered as an <img> (not a CSS
 * background) so exports can wait for it to decode, sized by computeBackgroundBox so the
 * editor preview and the exported file match exactly.
 */
export const TemplateBackground: React.FC<TemplateBackgroundProps> = ({ url, bgScale = 100, bgPositionX = 50, bgPositionY = 50 }) => {
  if (!url) return null;
  const box = computeBackgroundBox(bgScale, bgPositionX, bgPositionY);
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: `${box.left}%`,
        top: `${box.top}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
        pointerEvents: 'none',
      }}
    >
      <img
        src={url}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: box.objectPosition, display: 'block', maxWidth: 'none' }}
      />
    </div>
  );
};
