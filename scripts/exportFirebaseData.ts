import { db } from './src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

interface Program {
    id: string;
    name: string;
    category: string;
    status: string;
    teams: any[];
    participantsCount?: number;
    isGroup?: boolean;
    startTime?: string;
    venue?: string;
    assignedCode?: string;
    [key: string]: any;
}

async function exportFirebaseData() {
    try {
        console.log('🔄 Starting Firebase data export...');

        // Fetch all events from Firestore (events collection)
        const eventsCollection = collection(db, 'events');
        const eventsSnapshot = await getDocs(eventsCollection);

        const programs: Program[] = [];

        eventsSnapshot.forEach((doc) => {
            programs.push({
                id: doc.id,
                ...doc.data()
            } as Program);
        });

        console.log(`✅ Fetched ${programs.length} events from Firebase`);

        // Calculate statistics
        const stats = {
            totalPrograms: programs.length,
            programsByStatus: {
                PENDING: programs.filter(p => p.status === 'PENDING').length,
                JUDGING: programs.filter(p => p.status === 'JUDGING').length,
                COMPLETED: programs.filter(p => p.status === 'COMPLETED').length,
            },
            totalParticipants: programs.reduce((sum, p) => {
                return sum + p.teams.reduce((teamSum, t) => teamSum + t.participants.length, 0);
            }, 0),
            programsByCategory: {} as Record<string, number>,
            teamRegistrations: {
                SAPIENTIA: 0,
                PRUDENTIA: 0
            }
        };

        // Count programs by category
        programs.forEach(p => {
            stats.programsByCategory[p.category] = (stats.programsByCategory[p.category] || 0) + 1;

            // Count team registrations
            p.teams.forEach(t => {
                if (t.teamName === 'SAPIENTIA') {
                    stats.teamRegistrations.SAPIENTIA += t.participants.length;
                } else if (t.teamName === 'PRUDENTIA') {
                    stats.teamRegistrations.PRUDENTIA += t.participants.length;
                }
            });
        });

        // Create export object
        const exportData = {
            exportDate: new Date().toISOString(),
            exportTimestamp: Date.now(),
            statistics: stats,
            programs: programs
        };

        // Create backup directory if it doesn't exist
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `firebase-backup-${timestamp}.json`;
        const filepath = path.join(backupDir, filename);

        // Write to file
        fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf-8');

        console.log('\n📊 Export Statistics:');
        console.log(`   Total Programs: ${stats.totalPrograms}`);
        console.log(`   Total Participants: ${stats.totalParticipants}`);
        console.log(`   SAPIENTIA Registrations: ${stats.teamRegistrations.SAPIENTIA}`);
        console.log(`   PRUDENTIA Registrations: ${stats.teamRegistrations.PRUDENTIA}`);
        console.log(`\n   Programs by Status:`);
        console.log(`   - PENDING: ${stats.programsByStatus.PENDING}`);
        console.log(`   - JUDGING: ${stats.programsByStatus.JUDGING}`);
        console.log(`   - COMPLETED: ${stats.programsByStatus.COMPLETED}`);

        console.log(`\n✅ Data exported successfully to: ${filepath}`);
        console.log(`📁 File size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error exporting data:', error);
        process.exit(1);
    }
}

// Run the export
exportFirebaseData();
