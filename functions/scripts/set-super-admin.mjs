// Grants or revokes the Super Admin custom claim for an existing Google account.
//
// Run from your own machine (NOT from the browser) with credentials that can manage
// Firebase Auth, e.g. after `gcloud auth application-default login`, or with
// GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account key kept outside the repo.
//
//   cd functions
//   node scripts/set-super-admin.mjs --project <firebase-project-id> --email someone@gmail.com
//   node scripts/set-super-admin.mjs --project <firebase-project-id> --email someone@gmail.com --revoke
//
// The user must sign in with Google once before the claim can be set, and must sign out
// and back in (or wait up to 1 hour) for it to take effect.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const projectId = arg('project');
const email = arg('email');
const revoke = args.includes('--revoke');

if (!projectId || !email) {
  console.error('Usage: node scripts/set-super-admin.mjs --project <project-id> --email <email> [--revoke]');
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();

const user = await auth.getUserByEmail(email);
const claims = { ...(user.customClaims || {}) };
if (revoke) delete claims.superAdmin;
else claims.superAdmin = true;

await auth.setCustomUserClaims(user.uid, claims);
// Force existing sessions to pick up the change.
await auth.revokeRefreshTokens(user.uid);
console.log(`${revoke ? 'Revoked' : 'Granted'} Super Admin for uid ${user.uid}.`);
