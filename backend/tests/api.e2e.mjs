/**
 * End-to-end API tests against a running backend (default http://localhost:3001).
 *
 *   npm run dev          # in one terminal
 *   npm run test:e2e     # in another
 *
 * Uses the seeded dev account (prisma/seed.js) and local dev storage (backend/uploads/).
 * Creates its own temporary boxes and a temporary second user, and removes them afterwards.
 * Note: the public submit limit is 10/min per IP, so don't run it twice within a minute.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const API = process.env.API_URL || 'http://localhost:3001/api';
const UPLOADS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads');
const OWNER = { email: 'test@example.com', password: 'test123456' };
const INTRUDER = { email: 'e2e-intruder@example.com', password: 'intruder123', displayName: 'E2E Intruder' };

const prisma = new PrismaClient();
let pass = 0;
let fail = 0;
const check = (label, ok, extra = '') => {
  if (ok) pass += 1; else fail += 1;
  console.log(`${ok ? '✅' : '❌'} ${label}${extra ? `  (${extra})` : ''}`);
};

function client() {
  let cookie = '';
  return async (method, p, body, { raw, headers = {}, binary } = {}) => {
    const res = await fetch(API + p, {
      method,
      headers: { ...(body && !raw ? { 'Content-Type': 'application/json' } : {}), Cookie: cookie, ...headers },
      body: raw ? body : body ? JSON.stringify(body) : undefined,
    });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    if (binary) return { status: res.status, headers: res.headers, buf: Buffer.from(await res.arrayBuffer()) };
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data };
  };
}

const form = (fields, files = []) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  for (const [n, b, t] of files) fd.append('files', new Blob([b], { type: t }), n);
  return fd;
};

// 1x1 PNG and a minimal MP4-signature file
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex');
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(12), Buffer.alloc(200_000, 7)]);

const createdBoxes = [];

async function main() {
  const owner = client();
  const login = await owner('POST', '/auth/login', OWNER);
  if (login.status !== 200) throw new Error(`Login failed (${login.status}). Did you run "npm run db:seed"?`);

  // ── Phase 5: boxes ──────────────────────────────────────────────
  console.log('\n— Boxes');
  const box = (await owner('POST', '/boxes', { title: 'E2E test box', description: 'temporary' })).data.data.box;
  createdBoxes.push(box.id);
  check('create box', !!box?.publicSlug && box.publicSlug.length === 16);
  check('invalid box id -> 404', (await owner('GET', '/boxes/not-a-uuid')).status === 404);
  const qr = await owner('GET', `/boxes/${box.id}/qr`, null, { binary: true });
  check('QR code PNG', qr.status === 200 && qr.buf.subarray(0, 4).equals(PNG.subarray(0, 4)));

  // ── Phase 6: public submission ─────────────────────────────────
  console.log('\n— Public submission');
  const anon = client();
  const pub = await anon('GET', `/public/boxes/${box.publicSlug}`);
  check('public box info', pub.status === 200 && pub.data.data.box.acceptingMessages === true);
  check('public info hides owner/IDs', !JSON.stringify(pub.data).includes(box.id) && !JSON.stringify(pub.data).includes(OWNER.email));
  check('unknown slug -> 404', (await anon('GET', '/public/boxes/doesnotexist1234')).status === 404);

  const submit = (fd) => anon('POST', `/public/boxes/${box.publicSlug}/messages`, fd, { raw: true });
  check('text only -> 201', (await submit(form({ senderName: 'Text only', content: 'just words <script>x</script>' }))).status === 201);
  check('missing name -> 400', (await submit(form({ content: 'hi' }))).status === 400);
  const fake = await submit(form({ senderName: 'Eve' }, [['evil.jpg', Buffer.from('<?php echo 1; ?>  padding....'), 'image/jpeg']]));
  check('fake .jpg (magic bytes) -> 400', fake.status === 400);
  check('PNG renamed .mp4 -> 400', (await submit(form({ senderName: 'Eve' }, [['x.mp4', PNG, 'video/mp4']]))).status === 400);
  check('6 images -> 400', (await submit(form({ senderName: 'Eve' }, Array.from({ length: 6 }, (_, i) => [`p${i}.png`, PNG, 'image/png'])))).status === 400);
  check('2 images -> 201', (await submit(form({ senderName: 'Has image', content: 'look' }, [['a.png', PNG, 'image/png'], ['b.png', PNG, 'image/png']]))).status === 201);
  check('video -> 201', (await submit(form({ senderName: 'Has video' }, [['clip.mp4', MP4, 'video/mp4']]))).status === 201);

  await owner('PATCH', `/boxes/${box.id}/status`, { status: 'INACTIVE' });
  check('inactive box -> 403', (await submit(form({ senderName: 'Late', content: 'x' }))).status === 403);
  await owner('PATCH', `/boxes/${box.id}/status`, { status: 'ACTIVE' });

  // ── Phase 7: inbox ──────────────────────────────────────────────
  console.log('\n— Inbox');
  const base = `/boxes/${box.id}/messages`;
  let r = await owner('GET', base);
  const all = r.data.data.messages;
  check('list = 3, newest first', all.length === 3 && all[0].senderName === 'Has video');
  for (const [f, name] of [['image', 'Has image'], ['video', 'Has video'], ['text', 'Text only']]) {
    r = await owner('GET', `${base}?filter=${f}`);
    check(`filter=${f}`, r.data.data.messages.length === 1 && r.data.data.messages[0].senderName === name);
  }
  check('search', (await owner('GET', `${base}?search=video`)).data.data.messages.length === 1);
  r = await owner('GET', `${base}?page=2&limit=2`);
  check('pagination', r.data.data.messages.length === 1 && r.data.pagination.totalPages === 2);

  const imgMsg = all.find((m) => m.senderName === 'Has image');
  const vidMsg = all.find((m) => m.senderName === 'Has video');
  const imgUrl = imgMsg.files[0].url.replace(/^\/api/, '');
  const vidUrl = vidMsg.files[0].url.replace(/^\/api/, '');

  r = await owner('GET', imgUrl, null, { binary: true });
  check('stream image (bytes match)', r.status === 200 && r.buf.equals(PNG));
  r = await owner('GET', vidUrl, null, { binary: true, headers: { Range: 'bytes=0-99' } });
  check('video Range -> 206', r.status === 206 && r.buf.length === 100 && r.headers.get('content-range') === `bytes 0-99/${MP4.length}`);
  r = await owner('GET', vidUrl, null, { binary: true, headers: { Range: 'bytes=999999999-' } });
  check('bad Range -> 416', r.status === 416);

  // ── Access control ─────────────────────────────────────────────
  console.log('\n— Access control');
  const other = client();
  const reg = await other('POST', '/auth/register', INTRUDER);
  if (reg.status === 409) await other('POST', '/auth/login', INTRUDER);
  check('other user: box -> 404', (await other('GET', `/boxes/${box.id}`)).status === 404);
  check('other user: inbox -> 404', (await other('GET', base)).status === 404);
  check('other user: message -> 404', (await other('GET', `${base}/${imgMsg.id}`)).status === 404);
  check('other user: file -> 404', (await other('GET', imgUrl, null, { binary: true })).status === 404);
  check('other user: delete -> 404', (await other('DELETE', `${base}/${imgMsg.id}`)).status === 404);
  check('anonymous: file -> 401', (await anon('GET', imgUrl, null, { binary: true })).status === 401);
  check('anonymous: inbox -> 401', (await anon('GET', base)).status === 401);

  // ── Deletion + storage cleanup ─────────────────────────────────
  console.log('\n— Deletion');
  const imgDir = path.join(UPLOADS, box.id, imgMsg.id);
  check('files stored on disk', fs.existsSync(imgDir));
  r = await owner('DELETE', `${base}/${imgMsg.id}`);
  check('delete message', r.status === 200 && r.data.data.storageCleanup === 'done');
  check('message files removed', !fs.existsSync(imgDir));
  check('file gone -> 404', (await owner('GET', imgUrl, null, { binary: true })).status === 404);
  r = await owner('DELETE', base);
  check('delete all', r.data.data.deleted === 2);
  check('box folder removed', !fs.existsSync(path.join(UPLOADS, box.id)));
  r = await owner('DELETE', `/boxes/${box.id}`);
  check('delete box', r.status === 200);
  createdBoxes.length = 0;

  // ── Auth edge cases ────────────────────────────────────────────
  console.log('\n— Auth');
  const expired = await fetch(`${API}/auth/logout`, { method: 'POST', headers: { Cookie: 'token=bad.token.value' } });
  check('logout with invalid token still clears cookie', expired.status === 200 && /token=;/.test(expired.headers.get('set-cookie') || ''));
}

try {
  await main();
} catch (err) {
  fail += 1;
  console.error('❌ Aborted:', err.message);
} finally {
  // Cleanup: temp boxes (via DB, files via disk) and the temp second user
  for (const id of createdBoxes) {
    await prisma.messageBox.deleteMany({ where: { id } }).catch(() => {});
    fs.rmSync(path.join(UPLOADS, id), { recursive: true, force: true });
  }
  await prisma.user.deleteMany({ where: { email: INTRUDER.email } }).catch(() => {});
  await prisma.$disconnect();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
