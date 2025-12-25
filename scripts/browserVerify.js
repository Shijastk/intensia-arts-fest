// // Browser Console Verification Script
// // Copy and paste this into your browser console while your app is running

// (async function verifyCollections() {
//     console.log('🔍 Starting collection verification...\n');

//     try {
//         // Import Firestore functions from your app
//         const { db } = await import('./src/config/firebase');
//         const { collection, getDocs } = await import('firebase/firestore');

//         // Check events collection
//         console.log('📦 Checking ACTIVE collection: events');
//         const eventsRef = collection(db, 'events');
//         const eventsSnapshot = await getDocs(eventsRef);
//         console.log(`✅ Found ${eventsSnapshot.size} documents in 'events' collection`);

//         // Show sample data
//         if (eventsSnapshot.size > 0) {
//             console.log('\n📋 Sample events (first 3):');
//             eventsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
//                 const data = doc.data();
//                 console.log(`\n${index + 1}. ${data.name || 'Unnamed Event'}`);
//                 console.log(`   ID: ${doc.id}`);
//                 console.log(`   Category: ${data.category || 'N/A'}`);
//                 console.log(`   Status: ${data.status || 'N/A'}`);
//                 console.log(`   Teams: ${data.teams?.length || 0}`);
//             });
//         }

//         console.log('\n✅ Verification complete!');
//         console.log(`\n🎯 Your application is using the 'events' collection with ${eventsSnapshot.size} events.`);

//     } catch (error) {
//         console.error('❌ Error:', error);
//     }
// })();
