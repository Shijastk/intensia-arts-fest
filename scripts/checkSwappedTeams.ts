import { db } from '../src/config/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

/**
 * Check and Fix Swapped Team Names in Events Collection
 * 
 * This script:
 * 1. Checks if any participants have swapped team names
 * 2. Reports what needs to be fixed
 * 3. Optionally fixes the swapped team names
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

async function checkAndFixSwappedTeams() {
    try {
        console.log('🔍 Checking for swapped team names in events collection...\n');

        // Fetch all events
        const eventsRef = collection(db, 'events');
        const eventsSnapshot = await getDocs(eventsRef);

        if (eventsSnapshot.empty) {
            console.log('⚠️  No events found in the collection.');
            return;
        }

        console.log(`📦 Found ${eventsSnapshot.size} events to check\n`);

        const issues: Array<{
            eventId: string;
            eventName: string;
            participant: string;
            chestNumber: string;
            currentTeam: string;
            correctTeam: string;
        }> = [];

        const eventsToFix: Event[] = [];

        // Check each event
        eventsSnapshot.forEach((docSnapshot) => {
            const event = { id: docSnapshot.id, ...docSnapshot.data() } as Event;

            event.teams?.forEach((team) => {
                team.participants?.forEach((participant) => {
                    const chestNum = parseInt(participant.chestNumber);
                    let correctTeam = '';

                    // Determine correct team based on chest number
                    if (chestNum >= 200 && chestNum <= 299) {
                        correctTeam = 'PRUDENTIA';
                    } else if (chestNum >= 300 && chestNum <= 399) {
                        correctTeam = 'SAPIENTIA';
                    }

                    // Check if participant is in wrong team
                    if (correctTeam && team.teamName !== correctTeam) {
                        issues.push({
                            eventId: event.id,
                            eventName: event.name || 'Unnamed Event',
                            participant: participant.name,
                            chestNumber: participant.chestNumber,
                            currentTeam: team.teamName,
                            correctTeam: correctTeam
                        });

                        // Add event to fix list if not already there
                        if (!eventsToFix.find(e => e.id === event.id)) {
                            eventsToFix.push(event);
                        }
                    }
                });
            });
        });

        // Report findings
        console.log('═'.repeat(70));
        console.log('📊 ANALYSIS RESULTS');
        console.log('═'.repeat(70));

        if (issues.length === 0) {
            console.log('\n✅ GREAT NEWS! All team assignments are CORRECT!');
            console.log('   No swapped team names found.');
            console.log('\n   Chest 200-299 → PRUDENTIA ✓');
            console.log('   Chest 300-399 → SAPIENTIA ✓');
            console.log('\n✅ Your data is clean and ready to use!');
            process.exit(0);
        }

        console.log(`\n⚠️  Found ${issues.length} participants in WRONG teams across ${eventsToFix.length} events\n`);

        // Show first 10 issues as examples
        console.log('📋 Sample Issues (showing first 10):');
        console.log('─'.repeat(70));
        issues.slice(0, 10).forEach((issue, index) => {
            console.log(`\n${index + 1}. ${issue.participant} (Chest #${issue.chestNumber})`);
            console.log(`   Event: ${issue.eventName}`);
            console.log(`   Current Team: ${issue.currentTeam} ❌`);
            console.log(`   Correct Team: ${issue.correctTeam} ✅`);
        });

        if (issues.length > 10) {
            console.log(`\n   ... and ${issues.length - 10} more issues`);
        }

        console.log('\n' + '═'.repeat(70));
        console.log('🔧 FIX OPTIONS');
        console.log('═'.repeat(70));

        console.log('\n⚠️  This script is in CHECK-ONLY mode.');
        console.log('\nTo FIX the swapped team names:');
        console.log('1. Use the "Fix Team Assignments" button in the Admin Dashboard');
        console.log('2. Or manually update team names in Firebase Console');
        console.log('\n💡 The code has been fixed, so future assignments will be correct!');

        console.log('\n' + '═'.repeat(70));
        console.log('📝 SUMMARY');
        console.log('═'.repeat(70));
        console.log(`Total Events: ${eventsSnapshot.size}`);
        console.log(`Events with Issues: ${eventsToFix.length}`);
        console.log(`Participants in Wrong Teams: ${issues.length}`);
        console.log('═'.repeat(70) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during check:', error);
        process.exit(1);
    }
}

// Run the check
console.log('═'.repeat(70));
console.log('🔍 TEAM NAME SWAP CHECKER');
console.log('═'.repeat(70));
console.log('\nThis script checks if participants are in the correct teams:');
console.log('✓ Chest 200-299 should be in PRUDENTIA');
console.log('✓ Chest 300-399 should be in SAPIENTIA');
console.log('\nStarting check...\n');

setTimeout(() => {
    checkAndFixSwappedTeams();
}, 1000);
