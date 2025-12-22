import { useState, useEffect } from 'react';
import { Program } from '../types';
import {
    subscribeToPrograms,
    addProgram as addProgramToDb,
    updateProgram as updateProgramInDb,
    deleteProgram as deleteProgramFromDb,
    initializeMockData
} from '../services/firestore.service';
import { MOCK_PROGRAMS } from '../constants';

/**
 * Custom hook to manage programs with Firestore
 * Provides real-time sync and CRUD operations
 */
export const usePrograms = () => {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    // Subscribe to real-time updates
    useEffect(() => {
        const unsubscribe = subscribeToPrograms((updatedPrograms) => {
            setPrograms(updatedPrograms);
            setLoading(false);

            // DISABLED: Auto-initialization removed to prevent injecting mock data
            // if (!initialized && updatedPrograms.length === 0) {
            //     console.log('Firestore is empty. Initializing with mock data...');
            //     initializeMockData(MOCK_PROGRAMS).then(() => {
            //         console.log('Mock data initialization complete');
            //         setInitialized(true);
            //     });
            // } else {
            //     setInitialized(true);
            // }
            setInitialized(true);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [initialized]);

    // Add new program
    const addProgram = async (program: Omit<Program, 'id'>): Promise<boolean> => {
        try {
            setError(null);
            const id = await addProgramToDb(program);
            return id !== null;
        } catch (err) {
            setError('Failed to add program');
            console.error(err);
            return false;
        }
    };

    // Update existing program
    const updateProgram = async (id: string, updates: Partial<Program>): Promise<boolean> => {
        try {
            setError(null);
            return await updateProgramInDb(id, updates);
        } catch (err) {
            setError('Failed to update program');
            console.error(err);
            return false;
        }
    };

    // Delete program
    const deleteProgram = async (id: string): Promise<boolean> => {
        try {
            setError(null);
            return await deleteProgramFromDb(id);
        } catch (err) {
            setError('Failed to delete program');
            console.error(err);
            return false;
        }
    };

    // Batch update (for operations like updating multiple programs at once)
    const updateMany = async (updates: { id: string; data: Partial<Program> }[]): Promise<void> => {
        try {
            setError(null);
            await Promise.all(updates.map(({ id, data }) => updateProgramInDb(id, data)));
        } catch (err) {
            setError('Failed to update programs');
            console.error(err);
        }
    };

    return {
        programs,
        setPrograms: (updater: Program[] | ((prev: Program[]) => Program[])) => {
            // For compatibility with existing code that uses setPrograms directly
            // We'll handle local updates and sync to Firestore
            if (typeof updater === 'function') {
                const updated = updater(programs);
                // Note: This is for compatibility. Real updates should use updateProgram()
                console.warn('Direct setPrograms called. Consider using updateProgram() for Firebase sync.');
            }
        },
        loading,
        error,
        addProgram,
        updateProgram,
        deleteProgram,
        updateMany
    };
};
