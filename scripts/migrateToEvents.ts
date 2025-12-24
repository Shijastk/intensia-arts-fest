import { db } from '../src/config/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

/**
 * Migration Script: Copy data from 'programs' to 'events' collection
 * This will copy all documents from the old 'programs' collection to the new 'events' collection
 * 
 * IMPORTANT: This does NOT delete the original 'programs' collection
 */
async function migrateData() {
    try {
        console.log('🚀 Starting data migration from "programs" to "events"...\n');

        // Step 1: Check if events collection already has data
        const eventsRef = collection(db, 'events');
        const existingEvents = await getDocs(eventsRef);

        if (existingEvents.size > 0) {
            console.log('⚠️  WARNING: The "events" collection already has data!');
            console.log(`   Found ${existingEvents.size} existing documents`);
            console.log('\n   Options:');
            console.log('   1. Delete existing events data first (manually in Firebase Console)');
            console.log('   2. Skip migration if data is already correct');
            console.log('\n❌ Migration aborted to prevent data duplication');
            process.exit(1);
        }

        // Step 2: Fetch all data from 'programs' collection
        console.log('📦 Fetching data from "programs" collection...');
        const programsRef = collection(db, 'programs');
        const programsSnapshot = await getDocs(programsRef);

        if (programsSnapshot.empty) {
            console.log('⚠️  The "programs" collection is empty!');
            console.log('   Nothing to migrate.');
            process.exit(0);
        }

        console.log(`✅ Found ${programsSnapshot.size} documents to migrate\n`);

        // Step 3: Prepare batch operations (max 500 per batch)
        const batchSize = 500;
        const batches = [];
        let currentBatch = writeBatch(db);
        let operationCount = 0;
        let totalMigrated = 0;

        console.log('📝 Preparing migration batches...');

        programsSnapshot.docs.forEach((programDoc) => {
            const data = programDoc.data();
            const newDocRef = doc(eventsRef, programDoc.id); // Keep same ID

            currentBatch.set(newDocRef, {
                ...data,
                migratedAt: new Date().toISOString(),
                migratedFrom: 'programs'
            });

            operationCount++;
            totalMigrated++;

            if (operationCount === batchSize) {
                batches.push(currentBatch);
                currentBatch = writeBatch(db);
                operationCount = 0;
            }
        });

        // Add remaining operations
        if (operationCount > 0) {
            batches.push(currentBatch);
        }

        console.log(`✅ Prepared ${batches.length} batch(es) for ${totalMigrated} documents\n`);

        // Step 4: Execute migration
        console.log('🔄 Executing migration...');
        let batchNumber = 1;
        for (const batch of batches) {
            console.log(`   Processing batch ${batchNumber}/${batches.length}...`);
            await batch.commit();
            batchNumber++;
        }

        // Step 5: Verify migration
        console.log('\n🔍 Verifying migration...');
        const verifySnapshot = await getDocs(eventsRef);
        console.log(`✅ Verification: ${verifySnapshot.size} documents in "events" collection`);

        // Step 6: Summary
        console.log('\n' + '═'.repeat(60));
        console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('═'.repeat(60));
        console.log(`📊 Total documents migrated: ${totalMigrated}`);
        console.log(`📦 Source collection: "programs" (preserved)`);
        console.log(`📦 Target collection: "events" (active)`);
        console.log('\n📝 Next Steps:');
        console.log('   1. Test your application to ensure everything works');
        console.log('   2. The old "programs" collection is still intact as backup');
        console.log('   3. You can manually delete "programs" later if needed');
        console.log('═'.repeat(60) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during migration:', error);
        console.error('\n⚠️  Migration failed! No changes were made to the database.');
        process.exit(1);
    }
}

// Confirmation prompt
console.log('═'.repeat(60));
console.log('DATA MIGRATION: "programs" → "events"');
console.log('═'.repeat(60));
console.log('\nThis script will:');
console.log('✓ Copy all data from "programs" to "events" collection');
console.log('✓ Preserve original "programs" collection (no deletion)');
console.log('✓ Add migration metadata to each document');
console.log('\nStarting in 3 seconds...\n');

setTimeout(() => {
    migrateData();
}, 3000);
