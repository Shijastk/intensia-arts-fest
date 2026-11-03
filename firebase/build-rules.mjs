// Generates ../database.rules.json. RTDB rules have no functions, so the role helpers
// below are composed here and inlined. Edit this file, then run:
//   node firebase/build-rules.mjs
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const p = (s) => `(${s})`;
const or = (...xs) => p(xs.join(' || '));
const and = (...xs) => p(xs.join(' && '));

// ---- identity -------------------------------------------------------------------------
// The app runs on the free Spark plan (no Cloud Functions). Admins sign in with Google;
// staff (judges, green room, team leaders, staff admins) log in with a username and password
// checked in the browser, so the database cannot tell a staff member from a visitor. Fest
// data that staff change is therefore writable by anyone, but only inside an existing fest.
const SUPER = or("(auth != null && auth.token.superAdmin === true)",
  "(auth != null && root.child('superAdmins').child(auth.uid).val() === true)");
const GOOGLE = "auth.token.firebase.sign_in_provider === 'google.com'";
const ACTIVE_GOOGLE_USER = and('auth != null', GOOGLE, "root.child('users').child(auth.uid).child('isActive').val() !== false");

// Fest owner = the Google account recorded as the fest's adminUid (and not deactivated).
const OWNER = and(ACTIVE_GOOGLE_USER, "root.child('fests').child($festId).child('adminUid').val() === auth.uid");
const FEST_EXISTS = "root.child('fests').child($festId).child('adminUid').exists()";
const ANYONE_IN_FEST = or(SUPER, FEST_EXISTS);

// ---- validation helpers ---------------------------------------------------------------
const str = (max) => ({ '.validate': `newData.isString() && newData.val().length <= ${max}` });
const bool = { '.validate': 'newData.isBoolean()' };
const num = { '.validate': 'newData.isNumber()' };

const rules = {
  rules: {
    '.read': false,
    '.write': false,

    users: {
      '.read': SUPER,
      $uid: {
        '.read': "auth != null && auth.uid === $uid",
        '.write': or(SUPER, and('auth != null', 'auth.uid === $uid', GOOGLE)),
        role: { '.validate': "newData.val() === 'admin'" },
        email: str(320),
        name: str(200),
        createdAt: str(40),
        // Only the Super Admin can (de)activate an account.
        isActive: { '.validate': and('newData.isBoolean()', or(SUPER, 'newData.val() === data.val()')) },
        // A user can only point their profile at a fest they own.
        festId: {
          '.validate': and('newData.isString()', or(SUPER, 'newData.val() === data.val()', "root.child('fests').child(newData.val()).child('adminUid').val() === auth.uid"))
        },
        $other: { '.validate': SUPER }
      }
    },

    // Super Admins: add  <google uid>: true  here in the Firebase Console (Realtime Database).
    superAdmins: {
      $uid: { '.read': "auth != null && auth.uid === $uid", '.write': false }
    },

    fests: {
      '.read': SUPER,
      $festId: {
        // Super Admin: everything (incl. deleting a fest). Google user: may create a brand-new fest they own.
        '.write': or(SUPER, and(ACTIVE_GOOGLE_USER, '!data.exists()', "newData.child('adminUid').val() === auth.uid")),
        name: { '.read': true, '.write': or(SUPER, OWNER, FEST_EXISTS), ...str(200) },
        adminUid: { '.read': true, '.validate': and('newData.isString()', or('!data.exists()', 'newData.val() === data.val()', SUPER)) },
        createdAt: { '.read': true },
        // Fest name, theme, categories, scoring config, poster backgrounds.
        settings: { '.read': true, '.write': ANYONE_IN_FEST },
        // Fonts uploaded for posters/certificates.
        customFonts: {
          '.read': true,
          '.write': ANYONE_IN_FEST,
          $fontId: {
            '.validate': "newData.hasChildren(['family', 'dataUrl'])",
            family: { '.validate': "newData.isString() && newData.val().matches(/^[A-Za-z0-9 _-]{1,60}$/)" },
            dataUrl: { '.validate': "newData.isString() && newData.val().beginsWith('data:') && newData.val().length <= 1500000" },
            $other: { '.validate': false }
          }
        },
        students: {
          '.read': true,
          '.write': ANYONE_IN_FEST,
          $studentId: { '.validate': "newData.hasChildren(['name'])" }
        },
        // Staff accounts. Readable so the login page can check the salted password hash;
        // plain-text passwords can no longer be written (old ones may only be removed).
        staff: {
          '.read': true,
          '.write': ANYONE_IN_FEST,
          $staffId: {
            '.validate': "newData.hasChildren(['username', 'role'])",
            role: { '.validate': "newData.isString() && newData.val().matches(/^(GREEN_ROOM|JUDGE|TEAM_LEADER|ADMIN)$/)" },
            username: str(100),
            passwordHash: { '.validate': "newData.isString() && newData.val().matches(/^[0-9a-f]{64}$/)" },
            passwordSalt: { '.validate': "newData.isString() && newData.val().matches(/^[0-9a-f]{32}$/)" },
            password: { '.validate': false }
          }
        },
        programs: {
          '.read': true,
          '.write': ANYONE_IN_FEST,
          $programId: {
            name: str(300),
            category: str(200),
            status: { '.validate': "newData.isString() && newData.val().matches(/^(PENDING|JUDGING|COMPLETED|CANCELLED)$/)" },
            isPublished: bool,
            isResultPublished: bool,
            resultPublishedOrder: num,
            isAllocatedToJudge: bool,
            judgePanel: str(200)
          }
        }
      }
    },

    // No longer written (was the Cloud Functions' public copy / password store).
    publicFests: {
      $festId: { '.read': true, '.write': SUPER }
    },
    staffSecrets: { '.read': false, '.write': SUPER }
  }
};

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'database.rules.json');
writeFileSync(out, JSON.stringify(rules, null, 2) + '\n');
console.log('Wrote', out);
