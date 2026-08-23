import React from 'react';

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
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  backgroundUrl,
  participantName,
  chestNo,
  team,
  category,
  events,
  bgPositionX = 50,
  bgPositionY = 50,
  bgScale = 100,
  festName = "ARTS FEST"
}) => {
  return (
    <div 
      className="relative w-[794px] h-[1123px] bg-white mx-auto overflow-hidden shadow-xl"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: bgScale && bgScale !== 100 ? `${bgScale}%` : 'cover',
        backgroundPosition: `${bgPositionX}% ${bgPositionY}%`,
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Content wrapper to position elements relative to the design */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-[200px]">
        {/* Name */}
        <h1 className="text-5xl font-bold text-red-600 tracking-wider mb-4 font-serif">
          {participantName.toUpperCase()}
        </h1>

        {/* Details Row */}
        <p className="text-lg text-gray-600 mb-10 tracking-wide text-center px-12 leading-relaxed">
          Chest No. {chestNo} &middot; {team} &middot; <span className="whitespace-nowrap">{category}</span>
        </p>

        {/* Participated Events Text */}
        <div className="text-center px-24 text-gray-700 leading-relaxed text-lg">
          has participated in <span className="font-bold">{events.join(', ')}</span><br/>
          at <span className="font-bold text-black">{festName} &mdash; Celebration of Creativity</span>, held at Ismath Campus, Ismath English School Kalad, on 11, 12 & 13 August 2026.
        </div>
      </div>
    </div>
  );
};
