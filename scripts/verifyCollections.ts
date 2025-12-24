import { db } from '../src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Verification Script: Compare 'programs' and 'events' collections
 * This script checks if both collections exist and compares their data
 */
async function verifyCollections() {
    try {
        console.log('🔍 Starting collection verification...\n');

        // Fetch from 'programs' collection
        console.log('📦 Checking OLD collection: programs');
        const programsRef = collection(db, 'programs');
        const programsSnapshot = await getDocs(programsRef);
        const programsData: any[] = programsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`   Found ${programsData.length} documents in 'programs' collection`);

        // Fetch from 'events' collection
        console.log('\n📦 Checking NEW collection: events');
        const eventsRef = collection(db, 'events');
        const eventsSnapshot = await getDocs(eventsRef);
        const eventsData: any[] = eventsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`   Found ${eventsData.length} documents in 'events' collection`);

        // Compare
        console.log('\n📊 Comparison Results:');
        console.log('─'.repeat(50));
        console.log(`Programs Collection: ${programsData.length} documents`);
        console.log(`Events Collection:   ${eventsData.length} documents`);
        console.log('─'.repeat(50));

        if (programsData.length === 0 && eventsData.length === 0) {
            console.log('\n⚠️  Both collections are EMPTY');
            console.log('   You need to add data to the "events" collection');
        } else if (programsData.length > 0 && eventsData.length === 0) {
            console.log('\n⚠️  MIGRATION NEEDED!');
            console.log('   The "programs" collection has data but "events" is empty');
            console.log('   You should copy data from "programs" to "events"');
        } else if (programsData.length === 0 && eventsData.length > 0) {
            console.log('\n✅ Migration appears COMPLETE!');
            console.log('   The "events" collection has data');
            console.log('   The "programs" collection is empty (or was already migrated)');
        } else {
            console.log('\n✅ Both collections have data');
            console.log('   Application is now using "events" collection');
            console.log('   Old "programs" data is preserved as backup');
        }

        // Show sample data from events collection
        if (eventsData.length > 0) {
            console.log('\n📋 Sample from EVENTS collection (first 3):');
            eventsData.slice(0, 3).forEach((event, index) => {
                console.log(`\n   ${index + 1}. ${event.name || 'Unnamed Event'}`);
                console.log(`      ID: ${event.id}`);
                console.log(`      Category: ${event.category || 'N/A'}`);
                console.log(`      Status: ${event.status || 'N/A'}`);
            });
        }

        // Show sample data from programs collection
        if (programsData.length > 0) {
            console.log('\n📋 Sample from PROGRAMS collection (first 3):');
            programsData.slice(0, 3).forEach((program, index) => {
                console.log(`\n   ${index + 1}. ${program.name || 'Unnamed Program'}`);
                console.log(`      ID: ${program.id}`);
                console.log(`      Category: ${program.category || 'N/A'}`);
                console.log(`      Status: ${program.status || 'N/A'}`);
            });
        }

        console.log('\n✅ Verification complete!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during verification:', error);
        process.exit(1);
    }
}

// Run verification
verifyCollections();
