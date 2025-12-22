
export enum ProgramStatus {
  PENDING = 'PENDING',
  JUDGING = 'JUDGING', // New status for programs being evaluated
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Participant {
  name: string;
  chestNumber: string;
  codeLetter?: string;
  isCodeRevealed?: boolean; // Track if the code has been "scratched"
  role?: string;
}

export interface Team {
  id: string;
  teamName: string;
  participants: Participant[];
  score?: number;
  rank?: number;
  grade?: string;
  points?: number;
}

export interface Program {
  id: string;
  name: string;
  category: string;
  startTime?: string;
  venue?: string;
  status: ProgramStatus;
  teams: Team[];
  description: string;
  participantsCount: number;
  isGroup: boolean;
  groupCount?: number;
  membersPerGroup?: number;
  isPublished?: boolean; // Flag for Green Room visibility (Publish to Green Room)
  isResultPublished?: boolean; // Flag for Public Result visibility (Publish to Website)
  isAllocatedToJudge?: boolean; // Flag for Green Room allocation
  judgePanel?: string; // Stage/Panel assignment (e.g., "Stage 1", "Stage 2", "Panel A")
}

export interface FestivalStats {
  totalPrograms: number;
  completedCount: number;
  pendingCount: number;
  cancelledCount: number;
  totalParticipants: number;
  averageScore: number;
}

export interface ParticipantSummary {
  name: string;
  chestNumber: string;
  teamName: string;
  programCount: number;
  programNames: string[];
  achievements: { programName: string; rank: number }[];
  totalWins: number;
}
