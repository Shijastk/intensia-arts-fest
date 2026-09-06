import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD3yA24fYoIjcpU7KUmrCF4Z2-rwGwlPFU",
  authDomain: "gen-lang-client-0732239431.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0732239431-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gen-lang-client-0732239431",
  storageBucket: "gen-lang-client-0732239431.firebasestorage.app",
  messagingSenderId: "655228352742",
  appId: "1:655228352742:web:9cdb90cc296b62df8c6327"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

const run = async () => {
    try {
        const festsRef = ref(db, 'fests');
        const snapshot = await get(festsRef);
        const fests = snapshot.val();
        
        if (!fests) {
            console.log("No fests found");
            process.exit(0);
        }

        for (const festId of Object.keys(fests)) {
            const fest = fests[festId];
            if (!fest.programs) continue;

            const programs = fest.programs;
            const updates: any = {};
            
            // Find max existing resultPublishedOrder
            let maxOrder = 0;
            for (const progId of Object.keys(programs)) {
                const prog = programs[progId];
                if (typeof prog.resultPublishedOrder === 'number') {
                    maxOrder = Math.max(maxOrder, prog.resultPublishedOrder);
                }
            }

            let modified = 0;
            for (const progId of Object.keys(programs)) {
                const prog = programs[progId];
                if (prog.status === 'COMPLETED' && prog.isResultPublished && typeof prog.resultPublishedOrder !== 'number') {
                    maxOrder++;
                    updates[`fests/${festId}/programs/${progId}/resultPublishedOrder`] = maxOrder;
                    modified++;
                    console.log(`Setting order ${maxOrder} for program ${prog.name}`);
                }
            }

            if (Object.keys(updates).length > 0) {
                await update(ref(db), updates);
                console.log(`Updated ${modified} programs in fest ${festId}`);
            } else {
                console.log(`No updates needed for fest ${festId}`);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
