import React from 'react';

export interface WinnerDetails {
  place: 1 | 2 | 3;
  name: string;
  team: string;
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
}

export const PosterTemplate: React.FC<PosterTemplateProps> = ({
  backgroundUrl,
  eventName,
  category,
  winners,
  contentTop = 350,
  contentLeft = 96,
  textAlign = 'left',
  textColor = '#000000',
  secondaryColor = '#ca8a04',
  posterSize = 'portrait',
  bgPositionX = 50,
  bgPositionY = 50,
  bgScale = 100
}) => {
  const alignItems = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start';
  return (
    <div 
      className={`relative w-[1080px] ${posterSize === 'square' ? 'h-[1080px]' : 'h-[1350px]'} bg-white mx-auto overflow-hidden shadow-xl`}
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: bgScale && bgScale !== 100 ? `${bgScale}%` : 'cover',
        backgroundPosition: `${bgPositionX}% ${bgPositionY}%`,
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Content wrapper */}
      <div 
        className="absolute inset-0 flex flex-col justify-start"
        style={{ 
          paddingTop: `${contentTop}px`, 
          paddingLeft: `${contentLeft}px`, 
          paddingRight: `${contentLeft}px`,
          alignItems: alignItems,
          textAlign: textAlign
        }}
      >
        {/* Event Title */}
        <h1 className="text-5xl font-black uppercase tracking-wider mb-8 font-serif break-words max-w-full" style={{ color: textColor }}>
          {eventName}
        </h1>

        {/* Category */}
        <h2 className="text-xl font-bold uppercase tracking-[0.2em] mb-12 break-words max-w-full" style={{ color: secondaryColor }}>
          {category}
        </h2>

        {/* Winners List */}
        <div className="space-y-8 flex flex-col w-full" style={{ alignItems: alignItems }}>
          {winners.sort((a, b) => a.place - b.place).map((winner) => (
            <div key={winner.place} className="flex flex-col" style={{ alignItems: alignItems }}>
              <span className="text-sm font-bold uppercase tracking-widest mb-1 break-words max-w-full" style={{ color: secondaryColor }}>
                {winner.place}{winner.place === 1 ? 'ST' : winner.place === 2 ? 'ND' : 'RD'} PLACE
              </span>
              <span className="text-3xl font-black uppercase mb-1 break-words max-w-full leading-tight" style={{ color: textColor }}>
                {winner.name}
              </span>
              {winner.team && (
                <span className="text-sm uppercase tracking-wider break-words max-w-full" style={{ color: textColor, opacity: 0.8 }}>
                  {winner.team}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
