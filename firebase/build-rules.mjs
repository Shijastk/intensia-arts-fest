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
const SUPER = "(auth != null && auth.token.superAdmin === true)";
const GOOGLE = "auth.token.firebase.sign_in_provider === 'google.com'";
const ACTIVE_GOOGLE_USER = and('auth != null', GOOGLE, "root.child('users').child(auth.uid).child('isActive').val() !== false");

// Fest owner = the Google account recorded as the fest's adminUid (and not deactivated).
const OWNER = and(ACTIVE_GOOGLE_USER, "root.child('fests').child($festId).child('adminUid').val() === auth.uid");

// Staff = holder of a server-issued custom token for this fest whose record still exists
// and is not disabled. Role / panel / team are read from the database, never from the client.
const STAFF_REC = "root.child('fests').child($festId).child('staff').child(auth.token.staffId)";
const IS_STAFF = and('auth != null', 'auth.token.festId === $festId', 'auth.token.staffId != null',
  `${STAFF_REC}.exists()`, `${STAFF_REC}.child('isDisabled').val() !== true`);
const ROLE = (role) => and(IS_STAFF, `${STAFF_REC}.child('role').val() === '${role}'`);

const ADMIN = or(SUPER, OWNER, ROLE('ADMIN'));
const GREEN_ROOM = ROLE('GREEN_ROOM');
const MEMBER = or(ADMIN, IS_STAFF);

// A judge may only work on programs allocated to their panel (a judge with no panel
// assigned, e.g. a chief judge, may work on every program of the fest).
const PROG = "root.child('fests').child($festId).child('programs').child($programId)";
const JUDGE_PANEL = `${STAFF_REC}.child('judgePanel').val()`;
const JUDGE_FOR = and(ROLE('JUDGE'), or(`${JUDGE_PANEL} == null`, `${JUDGE_PANEL} === ''`, `${PROG}.child('judgePanel').val() === ${JUDGE_PANEL}`));

// ---- validation helpers ---------------------------------------------------------------
const UNCHANGED = 'newData.val() === data.val()';
const onlyBy = (who) => ({ '.validate': or(who, UNCHANGED) });
const str = (max) => ({ '.validate': `newData.isString() && newData.val().length <= ${max}` });
const bool = { '.validate': 'newData.isBoolean()' };
const num = { '.validate': 'newData.isNumber()' };
const scoreFields = (who) => ({ score: onlyBy(who), grade: onlyBy(who), points: onlyBy(who), rank: onlyBy(who) });

const SCORER = or(ADMIN, JUDGE_FOR);
const CODE_KEEPER = or(ADMIN, GREEN_ROOM);

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
        isActive: { '.validate': and('newData.isBoolean()', or(SUPER, UNCHANGED)) },
        // A user can only point their profile at a fest they own.
        festId: {
          '.validate': and('newData.isString()', or(SUPER, UNCHANGED, "root.child('fests').child(newData.val()).child('adminUid').val() === auth.uid"))
        },
        $other: { '.validate': SUPER }
      }
    },

    fests: {
      '.read': SUPER,
      $festId: {
        // Super Admin: everything. Google user: may create a brand-new fest they own.
        '.write': or(SUPER, and(ACTIVE_GOOGLE_USER, '!data.exists()', "newData.child('adminUid').val() === auth.uid")),
        name: { '.read': MEMBER, '.write': ADMIN, ...str(200) },
        adminUid: { '.read': MEMBER, '.validate': and('newData.isString()', or('!data.exists()', UNCHANGED, SUPER)) },
        createdAt: { '.read': MEMBER },
        // Public: fest name, theme, categories, scoring config, poster backgrounds.
        settings: { '.read': true, '.write': ADMIN },
        students: {
          '.read': MEMBER,
          '.write': ADMIN,
          $studentId: { '.validate': "newData.hasChildren(['name'])" }
        },
        // Profiles only (no passwords). Created/changed exclusively by the manageStaff function.
        staff: {
          '.read': or(ADMIN, GREEN_ROOM),
          $staffId: {
            '.read': and('auth != null', 'auth.token.festId === $festId', 'auth.token.staffId === $staffId'),
            password: { '.validate': false }
          }
        },
        programs: {
          '.read': or(ADMIN, GREEN_ROOM),
          '.write': ADMIN,
          $programId: {
            '.read': JUDGE_FOR,
            name: str(300),
            category: str(200),
            status: { '.write': or(GREEN_ROOM, JUDGE_FOR), '.validate': "newData.isString() && newData.val().matches(/^(PENDING|JUDGING|COMPLETED|CANCELLED)$/)" },
            isPublished: { '.write': JUDGE_FOR, '.validate': and('newData.isBoolean()', or(ADMIN, 'newData.val() === false')) },
            isResultPublished: bool,
            resultPublishedOrder: num,
            isAllocatedToJudge: { '.write': GREEN_ROOM, ...bool },
            judgePanel: { '.write': GREEN_ROOM, ...str(200) },
            teams: {
              '.write': or(GREEN_ROOM, JUDGE_FOR),
              $team: {
                id: onlyBy(ADMIN),
                teamName: onlyBy(ADMIN),
                ...scoreFields(SCORER),
                participants: {
                  $participant: {
                    name: onlyBy(ADMIN),
                    chestNumber: onlyBy(ADMIN),
                    role: onlyBy(ADMIN),
                    removalRequested: onlyBy(ADMIN),
                    codeLetter: onlyBy(CODE_KEEPER),
                    isCodeRevealed: onlyBy(CODE_KEEPER),
                    ...scoreFields(SCORER)
                  }
                }
              }
            }
          }
        }
      }
    },

    // Score-free public copy maintained by the mirrorPublicProgram function.
    publicFests: {
      $festId: { '.read': true, '.write': false }
    },

    // bcrypt hashes and lockout counters: server (Admin SDK) only.
    staffSecrets: { '.read': false, '.write': false }
  }
};

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'database.rules.json');
writeFileSync(out, JSON.stringify(rules, null, 2) + '\n');
console.log('Wrote', out);
