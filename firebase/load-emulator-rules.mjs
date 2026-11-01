// Loads database.rules.json into the local Database emulator namespace that the app and the
// functions use in emulator mode ("demo-intensia"). firebase.json only applies the rules to the
// default "<project>-default-rtdb" namespace, so without this the emulator runs with open rules.
//   npm run emulators         (in one terminal)
//   npm run emulators:rules   (once the emulators are ready)
//   npm run dev -- --mode emulator
import { readFileSync } from 'fs';

const rules = readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8');
const res = await fetch('http://127.0.0.1:9000/.settings/rules.json?ns=demo-intensia', {
  method: 'PUT',
  headers: { Authorization: 'Bearer owner' },
  body: rules
});
if (!res.ok) {
  console.error('Failed to load rules:', res.status, await res.text());
  process.exit(1);
}
const check = await fetch('http://127.0.0.1:9000/fests.json?ns=demo-intensia&shallow=true');
console.log(`Rules loaded. Unauthenticated read of /fests -> HTTP ${check.status} (expected 401).`);
