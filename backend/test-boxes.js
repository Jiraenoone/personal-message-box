import * as boxesService from './src/services/boxes.service.js';
import prisma from './src/utils/prisma.js';

async function runBoxesTests() {
  console.log('🧪 Running Phase 5 Message Box Management Tests (PostgreSQL)...\n');
  let passed = 0;
  let failed = 0;

  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });

  if (!testUser) {
    console.error('❌ Test user not found. Did seed run?');
    process.exit(1);
  }

  let createdBoxId = null;

  // Test 1: Create a new message box
  try {
    const box = await boxesService.createBox(testUser.id, {
      title: 'Birthday 2026 Wishes',
      description: 'Leave me a birthday wish and photo!',
    });

    createdBoxId = box.id;
    if (box.title === 'Birthday 2026 Wishes' && box.publicSlug && box.status === 'ACTIVE') {
      console.log('✅ Test 1 Passed: Created box successfully with publicSlug:', box.publicSlug);
      passed++;
    } else {
      console.error('❌ Test 1 Failed: Unexpected box data', box);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 1 Failed with error:', err);
    failed++;
  }

  // Test 2: List user boxes
  try {
    const boxes = await boxesService.getUserBoxes(testUser.id);
    if (boxes.some((b) => b.id === createdBoxId)) {
      console.log('✅ Test 2 Passed: getUserBoxes returns created box in list');
      passed++;
    } else {
      console.error('❌ Test 2 Failed: Box not in user boxes list');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 2 Failed:', err);
    failed++;
  }

  // Test 3: Update box
  try {
    const updated = await boxesService.updateBox(createdBoxId, testUser.id, {
      title: 'Updated Birthday Wishes',
      description: 'New updated description',
    });

    if (updated.title === 'Updated Birthday Wishes' && updated.description === 'New updated description') {
      console.log('✅ Test 3 Passed: updateBox updated title and description');
      passed++;
    } else {
      console.error('❌ Test 3 Failed:', updated);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 3 Failed:', err);
    failed++;
  }

  // Test 4: Update status
  try {
    const inactive = await boxesService.updateBoxStatus(createdBoxId, testUser.id, 'INACTIVE');
    const active = await boxesService.updateBoxStatus(createdBoxId, testUser.id, 'ACTIVE');

    if (inactive.status === 'INACTIVE' && active.status === 'ACTIVE') {
      console.log('✅ Test 4 Passed: updateBoxStatus toggled status correctly');
      passed++;
    } else {
      console.error('❌ Test 4 Failed: Status toggle mismatch');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 4 Failed:', err);
    failed++;
  }

  // Test 5: Generate QR code PNG
  try {
    const { buffer, fileName } = await boxesService.generateQRCodePNG(createdBoxId, testUser.id);

    // PNG signature starts with 0x89 0x50 0x4E 0x47
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    if (isPNG && buffer.length > 500 && fileName.endsWith('.png')) {
      console.log('✅ Test 5 Passed: QR Code PNG buffer generated correctly (size: ' + buffer.length + ' bytes)');
      passed++;
    } else {
      console.error('❌ Test 5 Failed: Invalid PNG output');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 5 Failed:', err);
    failed++;
  }

  // Test 6: Delete box
  try {
    await boxesService.deleteBox(createdBoxId, testUser.id);
    const boxesAfter = await boxesService.getUserBoxes(testUser.id);
    if (!boxesAfter.some((b) => b.id === createdBoxId)) {
      console.log('✅ Test 6 Passed: deleteBox removed box from database');
      passed++;
    } else {
      console.error('❌ Test 6 Failed: Box still exists after delete');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 6 Failed:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runBoxesTests();
