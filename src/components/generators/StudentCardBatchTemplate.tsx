import React from 'react';
import { TemplateBackground } from './TemplateBackground';

export interface StudentCardData {
  name: string;
  chestNo: string;
  team: string;
  category: string;
  events: string[];
}

interface StudentCardBatchTemplateProps {
  students: StudentCardData[]; 
  layoutType: 'detailed' | 'simple';
  backgroundUrl?: string; 
  cardsPerPage?: 9 | 12 | 16;
  bgPositionX?: number;
  bgPositionY?: number;
  bgScale?: number;
  festName?: string;
  // Picked in Publishing → Student Cards. Unset = the original colours.
  textColor?: string;      // chest number, team line, events
  secondaryColor?: string; // student name, fest name
}

// A picked colour, or the card's original Tailwind colour when none is picked.
const tone = (picked: string | undefined, fallback: string, opacity = 1) =>
  picked ? { className: '', style: { color: picked, opacity } } : { className: fallback, style: undefined };

export const StudentCardBatchTemplate: React.FC<StudentCardBatchTemplateProps> = ({
  students,
  layoutType,
  backgroundUrl,
  cardsPerPage = 9,
  bgPositionX = 50,
  bgPositionY = 50,
  bgScale = 100,
  festName = "ARTS FEST",
  textColor,
  secondaryColor
}) => {
  const nameTone = tone(secondaryColor, 'text-red-600');
  const chestTone = tone(textColor, 'text-black');
  const teamTone = tone(textColor, 'text-gray-500', 0.75);
  const eventsTone = tone(textColor, 'text-gray-700', 0.9);
  const simpleNameTone = tone(secondaryColor, 'text-blue-900');
  const simpleTeamTone = tone(textColor, 'text-gray-600', 0.75);
  const gridClass = cardsPerPage === 16 ? 'grid-cols-4 grid-rows-4' : cardsPerPage === 12 ? 'grid-cols-3 grid-rows-4' : 'grid-cols-3 grid-rows-3';
  return (
    <div className={`w-[794px] h-[1123px] bg-white mx-auto overflow-hidden grid ${gridClass} gap-2 p-4`}>
      {students.map((student, index) => (
        <div key={`${student.chestNo}-${index}`} className="w-full h-full">
          {layoutType === 'detailed' ? (
            // Detailed Layout (with background and events list)
            <div className="w-full h-full relative rounded-md overflow-hidden border border-gray-200 shadow-sm">
              <TemplateBackground url={backgroundUrl} bgScale={bgScale} bgPositionX={bgPositionX} bgPositionY={bgPositionY} />
              <div className="absolute inset-0 p-4 flex flex-col pt-16">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <h3 className={`text-sm font-bold ${nameTone.className} uppercase mb-1 leading-tight line-clamp-2 break-words pr-1`} style={nameTone.style}>
                      {student.name}
                    </h3>
                    <p className={`text-[10px] ${teamTone.className} uppercase tracking-wider mb-2 truncate`} style={teamTone.style}>
                      {student.team} &middot; {student.category}
                    </p>
                  </div>
                  <div className={`text-3xl font-black ${chestTone.className} shrink-0 pr-2 pb-1`} style={chestTone.style}>
                    {student.chestNo}
                  </div>
                </div>
                
                {/* Events List */}
                <div className={`grid grid-rows-5 grid-flow-col gap-x-2 gap-y-[2px] text-[9px] ${eventsTone.className} mt-2 overflow-hidden h-[120px] content-start`} style={eventsTone.style}>
                  {student.events.map((event, i) => (
                    <div key={i} className="truncate">
                      {i + 1}. {event}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Simple Layout (dashed border, centered info)
            <div className="w-full h-full rounded-xl border-2 border-dashed border-gray-400 p-4 flex flex-col items-center justify-center text-center bg-white">
              <div className={`text-[10px] font-bold ${nameTone.className} tracking-[0.2em] mb-4 whitespace-nowrap truncate w-full px-2`} style={nameTone.style}>{festName}</div>
              <h1 className={`text-6xl font-black ${chestTone.className} mb-4 w-full`} style={chestTone.style}>{student.chestNo}</h1>
              <h2 className={`text-sm font-bold ${simpleNameTone.className} uppercase tracking-wide mb-1 break-words w-full px-2 leading-tight line-clamp-2`} style={simpleNameTone.style}>
                {student.name}
              </h2>
              <p className={`text-[10px] ${simpleTeamTone.className} uppercase`} style={simpleTeamTone.style}>
                {student.team}
              </p>
            </div>
          )}
        </div>
      ))}
      {/* Fill empty spots if less than cardsPerPage */}
      {Array.from({ length: Math.max(0, cardsPerPage - students.length) }).map((_, idx) => (
        <div key={`empty-${idx}`} className="w-full h-full rounded-xl border border-gray-100 bg-gray-50/50" />
      ))}
    </div>
  );
};
