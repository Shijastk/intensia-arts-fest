
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
  score?: number;
  grade?: string;
  points?: number;
  rank?: number;
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
  festId: string;
  name: string;
  category: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // in minutes
  venue?: string;
  status: ProgramStatus;
  teams: Team[];
  description: string;
  participantsCount: number;
  isGroup: boolean;
  groupCount?: number;
  membersPerGroup?: number;
  zone?: string;
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

export interface GalleryImage {
  id: string;
  imageUrl: string;
  createdAt: any; // Firestore Timestamp
  uploadedBy?: string;
}

export type UserRole = 'admin' | 'greenroom' | 'judge' | 'teamleader';
export type ViewType = 'ADMIN' | 'GREEN_ROOM' | 'TEAM_LEADER' | 'JUDGES' | 'SETTINGS';

export interface User {
  uid: string;
  username: string;
  role: UserRole;
  festId: string;
  displayName: string;
  teamName?: string;
  judgePanel?: string;
}

export const STORAGE_KEYS = {
  USER: 'Intensia_current_user',
  VIEW: 'Intensia_current_view'
} as const;


export interface Staff {
  id: string;
  festId: string;
  role: 'GREEN_ROOM' | 'JUDGE' | 'TEAM_LEADER';
  username: string;
  password?: string;
  panelName?: string; // For Judges or Team Leaders
  stage?: string;     // For Green Room or Judges
  judgePanel?: string; // Additional property to fix TS error
  teamName?: string; // Additional property to fix TS error
}

export interface Settings {
  categories: string[];
  maxStudentsPerTeam: number;
  maxNonGeneralPerStudent: number;
}