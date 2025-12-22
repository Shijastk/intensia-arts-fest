
import { Program, ProgramStatus } from './types';

export const MOCK_PROGRAMS: Program[] = [
  {
    id: 'p1',
    name: 'Classical Solo Dance',
    category: 'A zone stage',
    startTime: '2024-05-20 09:00 AM',
    venue: 'Main Auditorium',
    status: ProgramStatus.PENDING,
    description: 'A showcase of traditional classical dance forms.',
    participantsCount: 6,
    isGroup: false,
    teams: [
      { id: 't1', teamName: 'Natya Academy', participants: [{ name: 'Anjali Nair', chestNumber: '101' }] },
      { id: 't2', teamName: 'Kalakshetra', participants: [{ name: 'Meera Krishnan', chestNumber: '102' }] },
      { id: 't3', teamName: 'Temple Arts', participants: [{ name: 'Sita Ram', chestNumber: '103' }] },
      { id: 't4', teamName: 'Rhythm House', participants: [{ name: 'Lakshmi Devi', chestNumber: '104' }] },
      { id: 't5', teamName: 'Dance Divine', participants: [{ name: 'Priya Mani', chestNumber: '105' }] },
      { id: 't6', teamName: 'Vocal Vibes', participants: [{ name: 'Rahul Bose', chestNumber: '106' }] }
    ]
  },
  {
    id: 'p2',
    name: 'Mime Act Solo',
    category: 'A zone stage',
    startTime: '2024-05-20 11:30 AM',
    venue: 'Mini Auditorium',
    status: ProgramStatus.PENDING,
    description: 'Silent storytelling through gestures.',
    participantsCount: 4,
    isGroup: false,
    teams: [
      { id: 't7', teamName: 'Silent Artists', participants: [{ name: 'Charlie Chaplin Jr', chestNumber: '201' }] },
      { id: 't8', teamName: 'Echo Arts', participants: [{ name: 'Buster Keaton', chestNumber: '202' }] },
      { id: 't9', teamName: 'Gesture Guild', participants: [{ name: 'Marcel Marceau Fan', chestNumber: '203' }] },
      { id: 't10', teamName: 'Mimic Masters', participants: [{ name: 'Rowan Atkinson', chestNumber: '204' }] }
    ]
  },
  {
    id: 'p3',
    name: 'Mono Act',
    category: 'A zone general stage',
    startTime: '2024-05-20 02:00 PM',
    venue: 'Open Arena',
    status: ProgramStatus.PENDING,
    participantsCount: 2,
    isGroup: false,
    description: 'Single person theatrical performance.',
    teams: [
      { id: 't11', teamName: 'Thespian Hub', participants: [{ name: 'Heath Ledger', chestNumber: '301' }] },
      { id: 't12', teamName: 'Acting Lab', participants: [{ name: 'Joaquin Phoenix', chestNumber: '302' }] }
    ]
  },
  {
    id: 'p4',
    name: 'Oppana Group',
    category: 'A zone stage',
    startTime: '2024-05-20 04:00 PM',
    venue: 'Main Stage',
    status: ProgramStatus.PENDING,
    /* Added missing description property */
    description: 'A traditional dance form popular in the Malabar region.',
    participantsCount: 5,
    isGroup: true,
    groupCount: 5,
    membersPerGroup: 7,
    teams: [
      { id: 't13', teamName: 'North Malabar Arts', participants: [{ name: 'Fathima Beevi', chestNumber: '401' }, { name: 'Ayesha', chestNumber: '402' }] },
      { id: 't14', teamName: 'Calicut Heritage', participants: [{ name: 'Zainaba', chestNumber: '403' }] },
      { id: 't15', teamName: 'Waynad Waves', participants: [{ name: 'Mariyam', chestNumber: '404' }] },
      { id: 't16', teamName: 'Kochi Kings', participants: [{ name: 'Sara', chestNumber: '405' }] },
      { id: 't17', teamName: 'Nilgiri Arts', participants: [{ name: 'Rehana', chestNumber: '406' }] }
    ]
  }
];