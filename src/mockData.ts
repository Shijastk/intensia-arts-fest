import { Program, ProgramStatus } from './types';

export const MOCK_PROGRAMS: Program[] = [
    {
        id: 'mock-1', festId: 'mock-fest',
        name: 'Qiraat (Quran Recitation)',
        category: 'A Zone - Stage Events',
        isGroup: false, participantsCount: 10, description: '',
        status: ProgramStatus.JUDGING,
        venue: 'Main Auditorium',
        startTime: '09:00 AM',
        teams: [
            { id: 't10', teamName: 'Ali Raza', participants: [{ name: 'Ali Raza', chestNumber: '201' }] },
            { id: 't11', teamName: 'Hassan Jabbar', participants: [{ name: 'Hassan Jabbar', chestNumber: '202' }] },
            { id: 't12', teamName: 'Umar Khalid', participants: [{ name: 'Umar Khalid', chestNumber: '203' }] }
        ],
        isResultPublished: false
    },
    {
        id: 'mock-2', festId: 'mock-fest',
        name: 'Islamic Song (Group)',
        category: 'B Zone - Stage Events',
        isGroup: true, participantsCount: 5, description: '',
        status: ProgramStatus.JUDGING,
        venue: 'Open Stage 2',
        startTime: '10:30 AM',
        teams: [
            { id: 't13', teamName: 'Al-Noor Singers', participants: [] },
            { id: 't14', teamName: 'Voices of Huda', participants: [] },
            { id: 't15', teamName: 'Raza Symphony', participants: [] }
        ],
        isResultPublished: false
    },
    {
        id: 'mock-3', festId: 'mock-fest',
        name: 'Elocution (English)',
        category: 'C Zone - Literary Events',
        isGroup: false, participantsCount: 15, description: '',
        status: ProgramStatus.PENDING,
        venue: 'Seminar Hall',
        startTime: '11:15 AM',
        teams: [],
        isResultPublished: false
    },
    {
        id: 'mock-4', festId: 'mock-fest',
        name: 'Duffmuttu',
        category: 'General - Stage Events',
        isGroup: true, participantsCount: 4, description: '',
        status: ProgramStatus.PENDING,
        venue: 'Main Auditorium',
        startTime: '02:00 PM',
        teams: [],
        isResultPublished: false
    },
    {
        id: 'mock-5', festId: 'mock-fest',
        name: 'Essay Writing (Urdu)',
        category: 'A Zone - Off-Stage',
        isGroup: false, participantsCount: 20, description: '',
        status: ProgramStatus.COMPLETED,
        venue: 'Library Hall',
        startTime: 'Yesterday 10:00 AM',
        isResultPublished: true,
        teams: [
            { id: 't1', teamName: 'Muhammed Ali', rank: 1, points: 10, participants: [{ name: 'Muhammed Ali', chestNumber: '101', rank: 1, points: 10 }] },
            { id: 't2', teamName: 'Zayd Hassan', rank: 2, points: 6, participants: [{ name: 'Zayd Hassan', chestNumber: '102', rank: 2, points: 6 }] },
            { id: 't3', teamName: 'Abdullah Tariq', rank: 3, points: 2, participants: [{ name: 'Abdullah Tariq', chestNumber: '103', rank: 3, points: 2 }] }
        ]
    },
    {
        id: 'mock-6', festId: 'mock-fest',
        name: 'Mappilappattu (Individual)',
        category: 'B Zone - Stage Events',
        isGroup: false, participantsCount: 12, description: '',
        status: ProgramStatus.COMPLETED,
        venue: 'Main Auditorium',
        startTime: 'Yesterday 02:00 PM',
        isResultPublished: true,
        teams: [
            { id: 't4', teamName: 'Hamza Kareem', rank: 1, points: 10, participants: [{ name: 'Hamza Kareem', chestNumber: '104', rank: 1, points: 10 }] },
            { id: 't5', teamName: 'Faris Rahman', rank: 2, points: 6, participants: [{ name: 'Faris Rahman', chestNumber: '105', rank: 2, points: 6 }] },
            { id: 't6', teamName: 'Yaseen Ahmed', rank: 3, points: 2, participants: [{ name: 'Yaseen Ahmed', chestNumber: '106', rank: 3, points: 2 }] }
        ]
    },
    {
        id: 'mock-7', festId: 'mock-fest',
        name: 'Qawwali (Group)',
        category: 'General - Stage Events',
        isGroup: true, participantsCount: 6, description: '',
        status: ProgramStatus.COMPLETED,
        venue: 'Open Stage 2',
        startTime: 'Yesterday 06:30 PM',
        isResultPublished: true,
        teams: [
            { id: 't7', teamName: 'Darul Huda Squad', rank: 1, points: 15, participants: [] },
            { id: 't8', teamName: 'Al-Hidayah Group', rank: 2, points: 10, participants: [] },
            { id: 't9', teamName: 'Anwar-e-Raza', rank: 3, points: 5, participants: [] }
        ]
    }
];
