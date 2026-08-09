import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD3yA24fYoIjcpU7KUmrCF4Z2-rwGwlPFU",
  authDomain: "gen-lang-client-0732239431.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0732239431-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gen-lang-client-0732239431",
  storageBucket: "gen-lang-client-0732239431.firebasestorage.app",
  messagingSenderId: "655228352742",
  appId: "1:655228352742:web:9cdb90cc296b62df8c6327"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

const FEST_ID = 'sinas-3445';
const TEAMS = ['Arete', 'Lumière', 'Aegis', 'Élan'];

// Generate 120 students (30 per team)
const generateStudents = () => {
    const students: any = {};
    const firstNames = ['Mohammed', 'Abdullah', 'Rayhan', 'Aadil', 'Zayed', 'Omar', 'Yusuf', 'Imran', 'Hassan', 'Zayn', 'Hamza', 'Ali', 'Bilal', 'Tariq', 'Khalid'];
    const lastNames = ['Khan', 'Ali', 'Ahmed', 'Rahman', 'Malik', 'Hussain', 'Sayed', 'Rashid', 'Farooq', 'Siddiqui'];
    
    let chestCounter = 101;

    TEAMS.forEach(team => {
        students[team] = [];
        for (let i = 0; i < 30; i++) {
            const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            students[team].push({
                name,
                chestNumber: (chestCounter++).toString()
            });
        }
    });

    return students;
};

const studentsByTeam = generateStudents();

const generateParticipants = (teamName: string, count: number) => {
    const teamStudents = studentsByTeam[teamName];
    // Shuffle and pick
    const shuffled = [...teamStudents].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const mockPrograms: any = {};
let programIdCounter = 1;

const addProgram = (name: string, category: string, isGroup: boolean, status: 'PENDING' | 'JUDGING' | 'COMPLETED', teamsData: any[]) => {
    const id = `prog_${Date.now()}_${programIdCounter++}`;
    mockPrograms[id] = {
        id,
        festId: FEST_ID,
        name,
        category,
        isGroup,
        participantsCount: isGroup ? 0 : teamsData.reduce((acc, t) => acc + t.participants.length, 0),
        groupCount: isGroup ? teamsData.length : 0,
        membersPerGroup: isGroup ? teamsData[0]?.participants.length || 0 : 0,
        status,
        startTime: '10:00 AM',
        date: '2026-08-10',
        venue: 'Main Stage',
        judgePanel: 'Panel A',
        isAllocatedToJudge: status !== 'PENDING',
        isPublished: true, // MUST be true for Green Room to see it
        teams: teamsData
    };
};

const cleanObj = (obj: any) => {
    return Object.entries(obj).reduce((acc: any, [key, value]) => {
        if (value !== undefined) acc[key] = value;
        return acc;
    }, {});
};

const buildTeamsData = (status: 'PENDING' | 'JUDGING' | 'COMPLETED', isGroup: boolean, countPerTeam: number) => {
    let allTeams = TEAMS.map(teamName => {
        const participants = generateParticipants(teamName, countPerTeam).map((p: any) => {
            const code = status !== 'PENDING' ? Math.floor(1000 + Math.random() * 9000).toString() : undefined;
            const score = status === 'COMPLETED' ? Math.floor(50 + Math.random() * 50) : undefined;
            const grade = status === 'COMPLETED' ? (score! >= 90 ? 'A' : score! >= 70 ? 'B' : score! >= 50 ? 'C' : '') : undefined;
            let points = status === 'COMPLETED' ? (grade === 'A' ? 5 : grade === 'B' ? 3 : grade === 'C' ? 1 : 0) : undefined;
            
            return cleanObj({
                ...p,
                code,
                codeVerified: status !== 'PENDING',
                score,
                grade,
                points
            });
        });

        // For group events, score is at team level
        let teamScore, teamGrade, teamPoints;
        if (isGroup && status === 'COMPLETED') {
            teamScore = Math.floor(50 + Math.random() * 50);
            teamGrade = teamScore >= 90 ? 'A' : teamScore >= 70 ? 'B' : teamScore >= 50 ? 'C' : '';
            teamPoints = teamGrade === 'A' ? 10 : teamGrade === 'B' ? 6 : teamGrade === 'C' ? 2 : 0;
        }

        return cleanObj({
            id: `team_${Date.now()}_${Math.random()}`,
            teamName,
            participants,
            ...(isGroup && status === 'COMPLETED' ? { score: teamScore, grade: teamGrade, points: teamPoints } : {})
        });
    });

    // Fix bug: Sort and assign Rank 1, 2, 3 properly to avoid random rank/points mismatch
    if (status === 'COMPLETED') {
        if (isGroup) {
            const sorted = [...allTeams].sort((a, b) => (b.score || 0) - (a.score || 0));
            sorted.forEach((team, idx) => {
                if (idx < 3) {
                    team.rank = idx + 1;
                    const rankPoints = team.rank === 1 ? 5 : team.rank === 2 ? 3 : 1;
                    if (team.points !== undefined) team.points += rankPoints;
                }
            });
        } else {
            let allParticipants: any[] = [];
            allTeams.forEach(t => {
                t.participants.forEach((p: any) => {
                    allParticipants.push(p);
                });
            });
            allParticipants.sort((a, b) => (b.score || 0) - (a.score || 0));
            allParticipants.forEach((p, idx) => {
                if (idx < 3) {
                    p.rank = idx + 1;
                    const rankPoints = p.rank === 1 ? 5 : p.rank === 2 ? 3 : 1;
                    if (p.points !== undefined) p.points += rankPoints;
                }
            });
        }
    }

    return allTeams;
};

// PENDING PROGRAMS (Green Room needs to verify)
addProgram('Qiraat', 'A Zone', false, 'PENDING', buildTeamsData('PENDING', false, 2));
addProgram('Mappilappattu', 'B Zone', true, 'PENDING', buildTeamsData('PENDING', true, 5));
addProgram('Elocution Arabic', 'C Zone', false, 'PENDING', buildTeamsData('PENDING', false, 2));

// JUDGING PROGRAMS (Green room verified, Judges need to score)
addProgram('Duffmuttu', 'General', true, 'JUDGING', buildTeamsData('JUDGING', true, 8));
addProgram('Islamic Song', 'C Zone', true, 'JUDGING', buildTeamsData('JUDGING', true, 5));
addProgram('Quran Memorization', 'D Zone', false, 'JUDGING', buildTeamsData('JUDGING', false, 2));

// COMPLETED PROGRAMS (Judged, Leaderboard should show)
addProgram('Calligraphy', 'A Zone', false, 'COMPLETED', buildTeamsData('COMPLETED', false, 2));
addProgram('Essay Writing English', 'B Zone', false, 'COMPLETED', buildTeamsData('COMPLETED', false, 2));
addProgram('Poem Recitation Urdu', 'General', false, 'COMPLETED', buildTeamsData('COMPLETED', false, 2));
addProgram('Story Writing Arabic', 'C Zone', false, 'COMPLETED', buildTeamsData('COMPLETED', false, 2));
addProgram('Qawwali', 'General', true, 'COMPLETED', buildTeamsData('COMPLETED', true, 6));
addProgram('Debate English', 'D Zone', true, 'COMPLETED', buildTeamsData('COMPLETED', true, 2));
addProgram('Water Color', 'A Zone', false, 'COMPLETED', buildTeamsData('COMPLETED', false, 2));
addProgram('Pencil Drawing', 'B Zone', false, 'COMPLETED', buildTeamsData('COMPLETED', false, 2));
addProgram('Madh Song', 'C Zone', false, 'COMPLETED', buildTeamsData('COMPLETED', false, 2));


const run = async () => {
    console.log("Starting Mock Data Injection...");
    try {
        const programsRef = ref(db, `fests/${FEST_ID}/programs`);
        await set(programsRef, mockPrograms);
        console.log(`Successfully injected ${Object.keys(mockPrograms).length} programs for fest ${FEST_ID}!`);
        console.log("Check the application to see the rich mock data.");
        process.exit(0);
    } catch (err) {
        console.error("Error injecting mock data:", err);
        process.exit(1);
    }
};

run();
