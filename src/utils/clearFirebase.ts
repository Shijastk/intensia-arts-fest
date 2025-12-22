import { db } from '../config/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

/**
 * ⚠️ DANGER: Delete All Data from Firebase
 * This will permanently delete ALL programs and related data
 * Use with extreme caution!
 */
export const deleteAllFirebaseData = async (): Promise<boolean> => {
    try {
        console.log('🗑️ Starting to delete all Firebase data...');

        const programsRef = collection(db, 'programs');
        const snapshot = await getDocs(programsRef);

        if (snapshot.empty) {
            console.log('✅ No data to delete - Firebase is already empty');
            return true;
        }

        console.log(`Found ${snapshot.size} programs to delete...`);

        // Firestore batch can handle max 500 operations
        const batchSize = 500;
        const batches = [];
        let currentBatch = writeBatch(db);
        let operationCount = 0;

        snapshot.docs.forEach((doc) => {
            currentBatch.delete(doc.ref);
            operationCount++;

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

        // Commit all batches
        console.log(`Committing ${batches.length} batch(es)...`);
        await Promise.all(batches.map(batch => batch.commit()));

        console.log('✅ All Firebase data deleted successfully!');
        console.log('🎯 Database is now empty and ready for fresh start');

        return true;
    } catch (error) {
        console.error('❌ Error deleting Firebase data:', error);
        return false;
    }
};

/**
 * Add this to window for easy access in browser console
 */
if (typeof window !== 'undefined') {
    (window as any).clearFirebase = deleteAllFirebaseData;
}
