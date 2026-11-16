/**
 * Tests for "Sign in with Google" account resolution (no real Google call needed):
 * simulates verified Google profiles against the real database, plus the HTTP edges.
 *
 *   npm run dev                     # backend running (for the HTTP checks)
 *   node tests/google-signin.test.mjs
 *
 * Creates temporary users (e2e-google-*@example.com) and deletes them afterwards.
 */
import { PrismaClient } from '@prisma/client';
import { signInWithGoogle } from '../src/services/auth.service.js';

const API = process.env.API_URL || 'http://localhost:3001/api';
const prisma = new PrismaClient();
const PREFIX = 'e2e-google-';
let pass = 0;
let fail = 0;
const check = (label, ok, extra = '') => {
  if (ok) pass += 1; else fail += 1;
  console.log(`${ok ? '✅' : '❌'} ${label}${extra ? `  (${extra})` : ''}`);
};
const rejects = async (fn, pattern) => {
  try { await fn(); return false; } catch (e) { return pattern.test(e.message); }
};
const profile = (n, extra = {}) => ({
  sub: `test-sub-${n}-${Date.now()}`, email: `${PREFIX}${n}@example.com`, emailVerified: true, name: `Google User ${n}`, ...extra,
});

async function main() {
  console.log('\n— Account resolution');
  const p1 = profile('new');
  const a = await signInWithGoogle(p1);
  const row = await prisma.user.findUnique({ where: { id: a.user.id } });
  check('new Google user -> account created', a.created && row.email === p1.email && row.googleId === p1.sub);
  check('created account has no password', row.passwordHash === null);
  check('display name from Google profile', row.displayName === 'Google User new');
  check('JWT issued', typeof a.token === 'string' && a.token.split('.').length === 3);
  check('response hides googleId/passwordHash', !('googleId' in a.user) && !('passwordHash' in a.user));

  const again = await signInWithGoogle({ ...p1, email: p1.email.toUpperCase() });
  check('same Google account again -> same user, not created', again.user.id === a.user.id && !again.created);

  // Existing email/password account gets linked, and both sign-in methods keep working
  const pwEmail = `${PREFIX}password@example.com`;
  const reg = await fetch(`${API}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: pwEmail, password: 'password123', displayName: 'PW User' }),
  });
  check('register email/password account', reg.status === 201, `status ${reg.status}`);
  const pwUser = await prisma.user.findUnique({ where: { email: pwEmail } });
  const linked = await signInWithGoogle(profile('password', { email: pwEmail }));
  const pwAfter = await prisma.user.findUnique({ where: { email: pwEmail } });
  check('same email -> linked to existing account', linked.user.id === pwUser.id && !linked.created && !!pwAfter.googleId);
  check('linked account keeps its password', pwAfter.passwordHash === pwUser.passwordHash);
  const pwLogin = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: pwEmail, password: 'password123' }),
  });
  check('linked account can still log in with password', pwLogin.status === 200, `status ${pwLogin.status}`);

  console.log('\n— Safety');
  check('unverified Google email -> rejected', await rejects(() => signInWithGoogle(profile('unverified', { emailVerified: false })), /not verified/));
  check('unverified email cannot take over existing account', await rejects(
    () => signInWithGoogle(profile('takeover', { email: pwEmail, emailVerified: false })), /not verified/,
  ));
  check('email linked to another Google account -> rejected', await rejects(
    () => signInWithGoogle(profile('other', { email: pwEmail })), /different Google account/,
  ));

  const googleOnlyLogin = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: p1.email, password: 'anything123' }),
  });
  const body = await googleOnlyLogin.json();
  check('password login on Google-only account -> 401 with hint', googleOnlyLogin.status === 401 && /Google/.test(body.error?.message), body.error?.message);

  console.log('\n— HTTP');
  const start = await fetch(`${API}/auth/google`, { redirect: 'manual' });
  const loc = new URL(start.headers.get('location'));
  check('GET /auth/google -> 302 to Google', start.status === 302 && loc.host === 'accounts.google.com');
  check('requests identity + drive.file only', loc.searchParams.get('scope') === 'openid email profile https://www.googleapis.com/auth/drive.file');
  const forged = await fetch(`${API}/google-drive/callback?code=x&state=forged`, { redirect: 'manual' });
  check('forged state -> rejected', forged.headers.get('location')?.endsWith('/login?error=invalid_state'));
}

try {
  await main();
} catch (err) {
  fail += 1;
  console.error('❌ Aborted:', err);
} finally {
  const { count } = await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await prisma.$disconnect();
  console.log(`\n${pass} passed, ${fail} failed (cleaned up ${count} temp users)`);
  process.exit(fail ? 1 : 0);
}
