import React from 'react';

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
}

export const StudentCardBatchTemplate: React.FC<StudentCardBatchTemplateProps> = ({
  students,
  layoutType,
  backgroundUrl,
  cardsPerPage = 9,
  bgPositionX = 50,
  bgPositionY = 50,
  bgScale = 100,
  festName = "ARTS FEST"
}) => {
  const gridClass = cardsPerPage === 16 ? 'grid-cols-4 grid-rows-4' : cardsPerPage === 12 ? 'grid-cols-3 grid-rows-4' : 'grid-cols-3 grid-rows-3';
  return (
    <div className={`w-[794px] h-[1123px] bg-white mx-auto overflow-hidden grid ${gridClass} gap-2 p-4`}>
      {students.map((student, index) => (
        <div key={`${student.chestNo}-${index}`} className="w-full h-full">
          {layoutType === 'detailed' ? (
            // Detailed Layout (with background and events list)
            <div 
              className="w-full h-full relative rounded-md overflow-hidden border border-gray-200 shadow-sm"
              style={{
                backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
                backgroundSize: bgScale && bgScale !== 100 ? `${bgScale}%` : 'cover',
                backgroundPosition: `${bgPositionX}% ${bgPositionY}%`,
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className="absolute inset-0 p-4 flex flex-col pt-16">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <h3 className="text-sm font-bold text-red-600 uppercase mb-1 leading-tight line-clamp-2 break-words pr-1">
                      {student.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 truncate">
                      {student.team} &middot; {student.category}
                    </p>
                  </div>
                  <div className="text-3xl font-black text-black shrink-0 pr-2 pb-1">
                    {student.chestNo}
                  </div>
                </div>
                
                {/* Events List */}
                <div className="grid grid-rows-5 grid-flow-col gap-x-2 gap-y-[2px] text-[9px] text-gray-700 mt-2 overflow-hidden h-[120px] content-start">
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
              <div className="text-[10px] font-bold text-red-600 tracking-[0.2em] mb-4 whitespace-nowrap truncate w-full px-2">{festName}</div>
              <h1 className="text-6xl font-black text-black mb-4 w-full">{student.chestNo}</h1>
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-1 break-words w-full px-2 leading-tight line-clamp-2">
                {student.name}
              </h2>
              <p className="text-[10px] text-gray-600 uppercase">
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
