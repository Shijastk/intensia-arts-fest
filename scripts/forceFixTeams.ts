import { db } from '../src/config/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

/**
 * FORCE FIX: Manually fix swapped team names in Firebase
 * This script will directly update Firebase with correct team assignments
 */

interface Participant {
    name: string;
    chestNumber: string;
    [key: string]: any;
}

interface Team {
    teamName: string;
    participants: Participant[];
    [key: string]: any;
}

interface Event {
    id: string;
    name: string;
    teams: Team[];
    [key: string]: any;
}

async function forceFixSwappedTeams() {
    try {
        console.log('🔧 FORCE FIX: Correcting swapped team names...\n');

        // Fetch all events
        const eventsRef = collection(db, 'events');
        const eventsSnapshot = await getDocs(eventsRef);

        if (eventsSnapshot.empty) {
            console.log('⚠️  No events found.');
            return;
        }

        console.log(`📦 Found ${eventsSnapshot.size} events\n`);

        const eventsToFix: Array<{ id: string; name: string; teams: Team[] }> = [];
        let totalMoved = 0;

        // Check and prepare fixes
        eventsSnapshot.forEach((docSnapshot) => {
            const event = { id: docSnapshot.id, ...docSnapshot.data() } as Event;
            let needsFix = false;

            // Check if any participants are in wrong teams
            event.teams?.forEach((team) => {
                team.participants?.forEach((participant) => {
                    const chestNum = parseInt(participant.chestNumber);
                    let correctTeam = '';

                    if (chestNum >= 200 && chestNum <= 299) {
                        correctTeam = 'PRUDENTIA';
                    } else if (chestNum >= 300 && chestNum <= 399) {
                        correctTeam = 'SAPIENTIA';
                    }

                    if (correctTeam && team.teamName !== correctTeam) {
                        needsFix = true;
                    }
                });
            });

            if (needsFix) {
                // Reorganize participants into correct teams
                const allParticipants: Array<{ participant: Participant; originalTeam: string }> = [];

                event.teams.forEach(team => {
                    team.participants.forEach(participant => {
                        allParticipants.push({
                            participant: { ...participant },
                            originalTeam: team.teamName
                        });
                    });
                });

                // Create new team structure with CORRECT names (only include defined fields)
                const prudentiaTeam: any = {
                    id: `t-prudentia-${Date.now()}`,
                    teamName: 'PRUDENTIA',
                    participants: []
                };

                const sapientiaTeam: any = {
                    id: `t-sapientia-${Date.now()}`,
                    teamName: 'SAPIENTIA',
                    participants: []
                };

                // Redistribute participants
                allParticipants.forEach(({ participant }) => {
                    const chestNum = parseInt(participant.chestNumber);

                    if (chestNum >= 200 && chestNum <= 299) {
                        prudentiaTeam.participants.push(participant);
                        totalMoved++;
                    } else if (chestNum >= 300 && chestNum <= 399) {
                        sapientiaTeam.participants.push(participant);
                        totalMoved++;
                    }
                });

                // Preserve team-level data (only if defined)
                const originalPrudentia = event.teams.find(t => t.teamName === 'PRUDENTIA' || t.teamName === 'SAPIENTIA');
                const originalSapientia = event.teams.find(t => t.teamName === 'SAPIENTIA' || t.teamName === 'PRUDENTIA');

                if (originalPrudentia) {
                    if (originalPrudentia.score !== undefined) prudentiaTeam.score = originalPrudentia.score;
                    if (originalPrudentia.rank !== undefined) prudentiaTeam.rank = originalPrudentia.rank;
                    if (originalPrudentia.grade !== undefined) prudentiaTeam.grade = originalPrudentia.grade;
                    if (originalPrudentia.points !== undefined) prudentiaTeam.points = originalPrudentia.points;
                }

                if (originalSapientia) {
                    if (originalSapientia.score !== undefined) sapientiaTeam.score = originalSapientia.score;
                    if (originalSapientia.rank !== undefined) sapientiaTeam.rank = originalSapientia.rank;
                    if (originalSapientia.grade !== undefined) sapientiaTeam.grade = originalSapientia.grade;
                    if (originalSapientia.points !== undefined) sapientiaTeam.points = originalSapientia.points;
                }

                // Build new teams array
                const newTeams: Team[] = [];
                if (prudentiaTeam.participants.length > 0) {
                    newTeams.push(prudentiaTeam);
                }
                if (sapientiaTeam.participants.length > 0) {
                    newTeams.push(sapientiaTeam);
                }

                eventsToFix.push({
                    id: event.id,
                    name: event.name || 'Unnamed Event',
                    teams: newTeams
                });
            }
        });

        if (eventsToFix.length === 0) {
            console.log('✅ No fixes needed! All teams are correct.');
            process.exit(0);
        }

        console.log(`⚠️  Found ${eventsToFix.length} events that need fixing\n`);
        console.log('Events to fix:');
        eventsToFix.forEach((event, index) => {
            console.log(`  ${index + 1}. ${event.name} (ID: ${event.id})`);
        });

        console.log(`\n🔄 Applying fixes to Firebase...\n`);

        // Apply fixes using batch
        const batch = writeBatch(db);
        eventsToFix.forEach(event => {
            const eventRef = doc(db, 'events', event.id);
            batch.update(eventRef, { teams: event.teams });
        });

        await batch.commit();

        console.log('═'.repeat(70));
        console.log('✅ FIX COMPLETED SUCCESSFULLY!');
        console.log('═'.repeat(70));
        console.log(`Events Updated: ${eventsToFix.length}`);
        console.log(`Participants Reorganized: ${totalMoved}`);
        console.log('\n✅ All team assignments are now correct!');
        console.log('   Chest 200-299 → PRUDENTIA');
        console.log('   Chest 300-399 → SAPIENTIA');
        console.log('═'.repeat(70) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during fix:', error);
        process.exit(1);
    }
}

// Run the fix
console.log('═'.repeat(70));
console.log('🔧 FORCE FIX SWAPPED TEAMS');
console.log('═'.repeat(70));
console.log('\nThis will DIRECTLY update Firebase with correct team assignments.');
console.log('\nStarting in 2 seconds...\n');

setTimeout(() => {
    forceFixSwappedTeams();
}, 2000);
