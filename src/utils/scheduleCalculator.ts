import { Program } from '../types';

export interface ClashDetail {
  participantName: string;
  chestNumber: string;
  conflictingProgramName: string;
}

export const detectClashes = (
  targetProgram: Program,
  newStartTimeStr: string,
  newVenue: string,
  allPrograms: Program[]
): ClashDetail[] => {
  const clashes: ClashDetail[] = [];
  
  if (!newStartTimeStr || !targetProgram.duration) return clashes;

  const targetStart = new Date(newStartTimeStr).getTime();
  // Include 15-minute buffer in end time calculations for switching stages
  const targetEndWithBuffer = targetStart + (targetProgram.duration * 60 * 1000) + (15 * 60 * 1000);
  
  // Extract all participants from target program
  const targetChestNumbers = new Map<string, string>(); // chestNo -> name
  
  targetProgram.teams?.forEach(team => {
    team.participants?.forEach(p => {
      targetChestNumbers.set(p.chestNumber, p.name);
    });
  });

  if (targetChestNumbers.size === 0) return clashes; // No participants, no clashes

  allPrograms.forEach(progB => {
    if (progB.id === targetProgram.id) return;
    if (!progB.startTime || !progB.duration) return;

    const progBStart = new Date(progB.startTime).getTime();
    const progBEndWithBuffer = progBStart + (progB.duration * 60 * 1000) + (15 * 60 * 1000);

    // Check for overlap: (StartA < EndB) AND (EndA > StartB)
    if (targetStart < progBEndWithBuffer && targetEndWithBuffer > progBStart) {
      // Find intersecting participants
      progB.teams?.forEach(team => {
        team.participants?.forEach(p => {
          if (targetChestNumbers.has(p.chestNumber)) {
            clashes.push({
              participantName: p.name,
              chestNumber: p.chestNumber,
              conflictingProgramName: progB.name
            });
          }
        });
      });
    }
  });

  // Deduplicate clashes
  const uniqueClashes = Array.from(new Set(clashes.map(c => JSON.stringify(c)))).map(s => JSON.parse(s));
  return uniqueClashes;
};
