// Types based on your data structure
interface Participant {
  chestNumber: string;
  name: string;
  codeLetter?: string;
  isCodeRevealed?: boolean;
  rank?: number;
  grade?: string;
  points?: number;
  score?: number;
}

interface Team {
  teamName: string;
  participants: Participant[];
  id: string;
  points?: number;
  rank?: number;
  score?: number;
  grade?: string;
}

interface Competition {
  id: string;
  name: string;
  category: string;
  teams: Team[];
  status: string;
  isGroup: boolean;
  membersPerGroup: number;
  isAllocatedToJudge: boolean;
  isPublished: boolean;
  createdAt: any;
  updatedAt: any;
  judgePanel?: string;
  participantsCount: number;
  groupCount: number;
  description: string;
  venue: string;
  startTime: string;
}

interface ParticipantScores {
  chestNumber: string;
  name: string;
  totalPoints: number;
  events: {
    eventId: string;
    eventName: string;
    category: string;
    points: number;
    rank?: number;
    grade?: string;
    isGroup: boolean;
  }[];
}

interface TeamScores {
  teamName: string;
  zoneAScores: number;
  zoneBScores: number;
  totalScores: number;
  zoneACount: number;
  zoneBCount: number;
  totalCount: number;
}

interface ChampionResult {
  chestNumber: string;
  name: string;
  totalPoints: number;
  eventsCount: number;
}

interface ZoneResults {
  zoneAChampion: ChampionResult | null;
  zoneBChampion: ChampionResult | null;
  zoneBSeniorChampion: ChampionResult | null;
  zoneBJuniorChampion: ChampionResult | null;
  partialOffstageChampion: ChampionResult | null;
  teamScores: {
    PRUDENTIA: TeamScores;
    SAPIENTIA: TeamScores;
  };
}

class CompetitionAnalyzer {
  private competitions: Competition[];
  
  constructor(competitions: Competition[]) {
    this.competitions = competitions;
  }
  
  /**
   * Main function to analyze all competitions and calculate results
   */
  analyzeAll(): ZoneResults {
    // Filter only COMPLETED competitions with points
    const completedCompetitions = this.competitions.filter(comp => 
      comp.status === "COMPLETED" || comp.status === "JUDGING"
    );
    
    // Collect all participant scores
    const allParticipants = this.collectParticipantScores(completedCompetitions);
    
    // Calculate team scores by zone
    const teamScores = this.calculateTeamScores(completedCompetitions);
    
    // Find champions
    const zoneAChampion = this.findZoneChampion(allParticipants, 'A');
    const zoneBChampion = this.findZoneChampion(allParticipants, 'B');
    const zoneBSeniorChampion = this.findZoneBSeniorChampion(allParticipants);
    const zoneBJuniorChampion = this.findZoneBJuniorChampion(allParticipants);
    const partialOffstageChampion = this.findPartialOffstageChampion(completedCompetitions);
    
    return {
      zoneAChampion,
      zoneBChampion,
      zoneBSeniorChampion,
      zoneBJuniorChampion,
      partialOffstageChampion,
      teamScores
    };
  }
  
  /**
   * Collect all participant scores from competitions
   */
  private collectParticipantScores(competitions: Competition[]): Map<string, ParticipantScores> {
    const participantMap = new Map<string, ParticipantScores>();
    
    competitions.forEach(competition => {
      const zone = this.getZoneFromCategory(competition.category);
      const isStage = competition.category.includes('stage');
      const isNoStage = competition.category.includes('no stage');
      const isGeneral = competition.category.includes('general');
      
      competition.teams.forEach(team => {
        team.participants.forEach(participant => {
          if (participant.points && participant.points > 0) {
            const key = `${participant.chestNumber}-${participant.name}`;
            
            if (!participantMap.has(key)) {
              participantMap.set(key, {
                chestNumber: participant.chestNumber,
                name: participant.name.trim(),
                totalPoints: 0,
                events: []
              });
            }
            
            const participantData = participantMap.get(key)!;
            participantData.totalPoints += participant.points;
            
            participantData.events.push({
              eventId: competition.id,
              eventName: competition.name,
              category: competition.category,
              points: participant.points,
              rank: participant.rank,
              grade: participant.grade,
              isGroup: competition.isGroup
            });
          }
        });
      });
    });
    
    return participantMap;
  }
  

  /**
   * Calculate team scores by zone
   */
  private calculateTeamScores(competitions: Competition[]): {
    PRUDENTIA: TeamScores;
    SAPIENTIA: TeamScores;
  } {
    const teamScores = {
      PRUDENTIA: {
        teamName: 'PRUDENTIA',
        zoneAScores: 0,
        zoneBScores: 0,
        totalScores: 0,
        zoneACount: 0,
        zoneBCount: 0,
        totalCount: 0
      },
      SAPIENTIA: {
        teamName: 'SAPIENTIA',
        zoneAScores: 0,
        zoneBScores: 0,
        totalScores: 0,
        zoneACount: 0,
        zoneBCount: 0,
        totalCount: 0
      }
    };
    
    competitions.forEach(competition => {
      const zone = this.getZoneFromCategory(competition.category);
      
      competition.teams.forEach(team => {
        const teamName = team.teamName.toUpperCase();
        if (teamName === 'PRUDENTIA' || teamName === 'SAPIENTIA') {
          const teamScore = teamScores[teamName as keyof typeof teamScores];
          
          // Use team points if available, otherwise sum participant points
          let points = team.points || 0;
          if (points === 0 && team.participants.length > 0) {
            points = team.participants.reduce((sum, p) => sum + (p.points || 0), 0);
          }
          
          if (zone === 'A') {
            teamScore.zoneAScores += points;
            teamScore.zoneACount++;
          } else if (zone === 'B') {
            teamScore.zoneBScores += points;
            teamScore.zoneBCount++;
          }
          
          teamScore.totalScores += points;
          teamScore.totalCount++;
        }
      });
    });
    
    return teamScores;
  }
  
  /**
   * Find champion for a specific zone
   */
  private findZoneChampion(
    participantMap: Map<string, ParticipantScores>, 
    zone: 'A' | 'B'
  ): ChampionResult | null {
    let champion: ChampionResult | null = null;
    
    participantMap.forEach((participant) => {
      // Filter events for this zone
      const zoneEvents = participant.events.filter(event => {
        const eventZone = this.getZoneFromCategory(event.category);
        return eventZone === zone;
      });
      
      if (zoneEvents.length > 0) {
        const zonePoints = zoneEvents.reduce((sum, event) => sum + event.points, 0);
        
        if (!champion || zonePoints > champion.totalPoints) {
          champion = {
            chestNumber: participant.chestNumber,
            name: participant.name,
            totalPoints: zonePoints,
            eventsCount: zoneEvents.length
          };
        }
      }
    });
    
    return champion;
  }
  
  /**
   * Find B Zone Senior Champion
   */
  private findZoneBSeniorChampion(participantMap: Map<string, ParticipantScores>): ChampionResult | null {
    let champion: ChampionResult | null = null;
    
    participantMap.forEach((participant) => {
      // Filter events for B Zone Senior
      const seniorEvents = participant.events.filter(event => {
        const eventZone = this.getZoneFromCategory(event.category);
        return eventZone === 'B' && event.category.includes('senior');
      });
      
      if (seniorEvents.length > 0) {
        const seniorPoints = seniorEvents.reduce((sum, event) => sum + event.points, 0);
        
        if (!champion || seniorPoints > champion.totalPoints) {
          champion = {
            chestNumber: participant.chestNumber,
            name: participant.name,
            totalPoints: seniorPoints,
            eventsCount: seniorEvents.length
          };
        }
      }
    });
    
    return champion;
  }
  
  /**
   * Find B Zone Junior Champion
   */
  private findZoneBJuniorChampion(participantMap: Map<string, ParticipantScores>): ChampionResult | null {
    let champion: ChampionResult | null = null;
    
    participantMap.forEach((participant) => {
      // Filter events for B Zone Junior
      const juniorEvents = participant.events.filter(event => {
        const eventZone = this.getZoneFromCategory(event.category);
        return eventZone === 'B' && event.category.includes('junior');
      });
      
      if (juniorEvents.length > 0) {
        const juniorPoints = juniorEvents.reduce((sum, event) => sum + event.points, 0);
        
        if (!champion || juniorPoints > champion.totalPoints) {
          champion = {
            chestNumber: participant.chestNumber,
            name: participant.name,
            totalPoints: juniorPoints,
            eventsCount: juniorEvents.length
          };
        }
      }
    });
    
    return champion;
  }
  
  /**
   * Find Partial Offstage Champion (only no stage programs)
   */
  private findPartialOffstageChampion(competitions: Competition[]): ChampionResult | null {
    const offstageParticipantMap = new Map<string, ParticipantScores>();
    
    // Filter only offstage competitions (no stage or non stage)
    const offstageCompetitions = competitions.filter(comp => 
      comp.category.includes('no stage') || comp.category.includes('non stage')
    );
    
    // Collect scores from offstage competitions
    offstageCompetitions.forEach(competition => {
      const zone = this.getZoneFromCategory(competition.category);
      
      competition.teams.forEach(team => {
        team.participants.forEach(participant => {
          if (participant.points && participant.points > 0) {
            const key = `${participant.chestNumber}-${participant.name}`;
            
            if (!offstageParticipantMap.has(key)) {
              offstageParticipantMap.set(key, {
                chestNumber: participant.chestNumber,
                name: participant.name.trim(),
                totalPoints: 0,
                events: []
              });
            }
            
            const participantData = offstageParticipantMap.get(key)!;
            participantData.totalPoints += participant.points;
            
            participantData.events.push({
              eventId: competition.id,
              eventName: competition.name,
              category: competition.category,
              points: participant.points,
              rank: participant.rank,
              grade: participant.grade,
              isGroup: competition.isGroup
            });
          }
        });
      });
    });
    
    // Find champion with highest points
    let champion: ChampionResult | null = null;
    
    offstageParticipantMap.forEach((participant) => {
      if (!champion || participant.totalPoints > champion.totalPoints) {
        champion = {
          chestNumber: participant.chestNumber,
          name: participant.name,
          totalPoints: participant.totalPoints,
          eventsCount: participant.events.length
        };
      }
    });
    
    return champion;
  }
  
  /**
   * Helper function to extract zone from category string
   */
  private getZoneFromCategory(category: string): 'A' | 'B' | 'Other' {
    if (category.includes('A zone')) return 'A';
    if (category.includes('B zone')) return 'B';
    return 'Other';
  }
  
  /**
   * Get detailed participant results for a specific zone
   */
  getZoneParticipantResults(zone: 'A' | 'B'): ParticipantScores[] {
    const completedCompetitions = this.competitions.filter(comp => 
      (comp.status === "COMPLETED" || comp.status === "JUDGING") &&
      comp.category.includes(`${zone} zone`)
    );
    
    const participantMap = this.collectParticipantScores(completedCompetitions);
    
    return Array.from(participantMap.values())
      .filter(p => p.totalPoints > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }
  
  /**
   * Get all event results for a team
   */
  getTeamResults(teamName: string): {
    zoneA: { eventName: string; points: number; category: string }[];
    zoneB: { eventName: string; points: number; category: string }[];
  } {
    const teamResults = {
      zoneA: [] as { eventName: string; points: number; category: string }[],
      zoneB: [] as { eventName: string; points: number; category: string }[]
    };
    
    const completedCompetitions = this.competitions.filter(comp => 
      comp.status === "COMPLETED" || comp.status === "JUDGING"
    );
    
    completedCompetitions.forEach(competition => {
      const zone = this.getZoneFromCategory(competition.category);
      const team = competition.teams.find(t => 
        t.teamName.toUpperCase() === teamName.toUpperCase()
      );
      
      if (team) {
        const points = team.points || team.participants.reduce((sum, p) => sum + (p.points || 0), 0);
        
        const result = {
          eventName: competition.name,
          points: points,
          category: competition.category
        };
        
        if (zone === 'A') {
          teamResults.zoneA.push(result);
        } else if (zone === 'B') {
          teamResults.zoneB.push(result);
        }
      }
    });
    
    return teamResults;
  }
}

// Usage Example
export function analyzeCompetitionResults(competitions: Competition[]): {
  results: ZoneResults;
  analyzer: CompetitionAnalyzer;
} {
  const analyzer = new CompetitionAnalyzer(competitions);
  const results = analyzer.analyzeAll();
  
  return {
    results,
    analyzer
  };
}

// Helper function to calculate actual results from your data
export function calculateActualResults() {
  // This would be your actual competition data
  const competitions: Competition[] = []; // Your actual competition array here
  
  const { results } = analyzeCompetitionResults(competitions);
  
  // Calculate based on your actual data
  // From analyzing your data:
  // A Zone: 
  // - Completed events show PRUDENTIA with 3 points (Bullatin)
  // - More events but need to check which are COMPLETED
  
  // B Zone:
  // - Mas'ala Test: PRUDENTIA 6 points, SAPIENTIA 7 points
  // - Slogan Writing: PRUDENTIA 6 points, SAPIENTIA 5 points
  // - Poem Writing Malayalam: PRUDENTIA 9 points, SAPIENTIA 3 points
  // - Ibaarath Reading: PRUDENTIA 7 points, SAPIENTIA 4 points
  // - Story Writing Malayalam: PRUDENTIA 4 points, SAPIENTIA 4 points
  // - Social Tweet: PRUDENTIA 5 points, SAPIENTIA 3 points
  // - Letter Da'wa: PRUDENTIA 8 points, SAPIENTIA 5 points
  // - E-Poster: PRUDENTIA 9 points, SAPIENTIA 5 points
  
  // For PRUDENTIA in B Zone: 6+6+9+7+4+5+8+9 = 54 points
  // For SAPIENTIA in B Zone: 7+5+3+4+4+3+5+5 = 36 points
  
  // A Zone totals would need more completed events to calculate
  
  return results;
}