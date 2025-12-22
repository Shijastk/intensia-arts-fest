import { db } from '../config/firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { Program } from '../types';

// Collection names
export const COLLECTIONS = {
    PROGRAMS: 'programs',
    USERS: 'users'
};

/**
 * Programs Service
 */

// Get all programs (real-time listener)
export const subscribeToPrograms = (callback: (programs: Program[]) => void) => {
    const programsRef = collection(db, COLLECTIONS.PROGRAMS);
    const q = query(programsRef, orderBy('startTime', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const programs: Program[] = [];
        snapshot.forEach((doc) => {
            programs.push({ id: doc.id, ...doc.data() } as Program);
        });
        callback(programs);
    }, (error) => {
        console.error('Error fetching programs:', error);
        callback([]);
    });
};

// Get all programs (one-time fetch)
export const getAllPrograms = async (): Promise<Program[]> => {
    try {
        const programsRef = collection(db, COLLECTIONS.PROGRAMS);
        const q = query(programsRef, orderBy('startTime', 'asc'));
        const snapshot = await getDocs(q);

        const programs: Program[] = [];
        snapshot.forEach((doc) => {
            programs.push({ id: doc.id, ...doc.data() } as Program);
        });

        return programs;
    } catch (error) {
        console.error('Error getting programs:', error);
        return [];
    }
};

// Get single program
export const getProgram = async (id: string): Promise<Program | null> => {
    try {
        const programDoc = await getDoc(doc(db, COLLECTIONS.PROGRAMS, id));
        if (programDoc.exists()) {
            return { id: programDoc.id, ...programDoc.data() } as Program;
        }
        return null;
    } catch (error) {
        console.error('Error getting program:', error);
        return null;
    }
};

// Add new program
export const addProgram = async (program: Omit<Program, 'id'>): Promise<string | null> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.PROGRAMS), {
            ...program,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding program:', error);
        return null;
    }
};

// Update program
export const updateProgram = async (id: string, updates: Partial<Program>): Promise<boolean> => {
    try {
        const programRef = doc(db, COLLECTIONS.PROGRAMS, id);
        await updateDoc(programRef, {
            ...updates,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('Error updating program:', error);
        return false;
    }
};

// Delete program
export const deleteProgram = async (id: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.PROGRAMS, id));
        return true;
    } catch (error) {
        console.error('Error deleting program:', error);
        return false;
    }
};

// Batch update multiple programs
export const batchUpdatePrograms = async (updates: { id: string; data: Partial<Program> }[]): Promise<boolean> => {
    try {
        const batch = writeBatch(db);

        updates.forEach(({ id, data }) => {
            const programRef = doc(db, COLLECTIONS.PROGRAMS, id);
            batch.update(programRef, {
                ...data,
                updatedAt: Timestamp.now()
            });
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error batch updating programs:', error);
        return false;
    }
};

/**
 * Initialize mock data (run once to populate Firestore)
 */
export const initializeMockData = async (mockPrograms: Omit<Program, 'id'>[]): Promise<void> => {
    try {
        console.log('Initializing Firestore with mock data...');

        // Check if data already exists
        const existing = await getAllPrograms();
        if (existing.length > 0) {
            console.log('Data already exists in Firestore. Skipping initialization.');
            return;
        }

        // Add each mock program
        const batch = writeBatch(db);
        mockPrograms.forEach((program) => {
            const newDocRef = doc(collection(db, COLLECTIONS.PROGRAMS));
            batch.set(newDocRef, {
                ...program,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
        });

        await batch.commit();
        console.log('✅ Mock data initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing mock data:', error);
    }
};

/**
 * Clear all programs (use with caution!)
 */
export const clearAllPrograms = async (): Promise<boolean> => {
    try {
        const programsRef = collection(db, COLLECTIONS.PROGRAMS);
        const snapshot = await getDocs(programsRef);

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log('All programs cleared');
        return true;
    } catch (error) {
        console.error('Error clearing programs:', error);
        return false;
    }
};
