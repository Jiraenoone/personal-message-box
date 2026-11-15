import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PostgreSQL database...');

  const passwordHash = await bcrypt.hash('test123456', 12);

  // Upsert the test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      passwordHash,
      displayName: 'Tester (Demo User)',
    },
    create: {
      email: 'test@example.com',
      passwordHash,
      displayName: 'Tester (Demo User)',
    },
  });

  console.log(`✅ Seeded user: ${user.email} (ID: ${user.id})`);

  if (process.env.NODE_ENV === 'production') {
    console.log('⏭  Production: skipping mock Google Drive connection');
    return;
  }

  // Dev only: a mock "ACTIVE" Drive connection so boxes can be created without Google OAuth.
  // Uploads for this user go to backend/uploads/ (see fileStore.service.js).
  await prisma.googleDriveConnection.upsert({
    where: { userId: user.id },
    update: {
      status: 'ACTIVE',
      googleAccountId: 'test@example.com',
      rootFolderId: 'gdrive-root-folder-test',
    },
    create: {
      userId: user.id,
      googleAccountId: 'test@example.com',
      encryptedRefreshToken: 'mock-encrypted-refresh-token',
      rootFolderId: 'gdrive-root-folder-test',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Seeded Google Drive connection (ACTIVE) for test user');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
