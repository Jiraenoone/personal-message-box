import { validateRegister, validateLogin } from './src/validators/auth.validator.js';
import { generateToken, verifyToken } from './src/utils/jwt.js';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('🧪 Running Phase 3 Authentication Tests...\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Validation - Reject invalid email
  try {
    validateRegister({ email: 'bad-email', password: 'Password123', displayName: 'Test User' });
    console.error('❌ Test 1 Failed: Invalid email was accepted');
    failed++;
  } catch (err) {
    if (err.details?.some(d => d.field === 'email')) {
      console.log('✅ Test 1 Passed: Invalid email rejected correctly');
      passed++;
    } else {
      console.error('❌ Test 1 Failed: Unexpected error', err);
      failed++;
    }
  }

  // Test 2: Validation - Reject weak password
  try {
    validateRegister({ email: 'test@example.com', password: 'short', displayName: 'Test User' });
    console.error('❌ Test 2 Failed: Weak password was accepted');
    failed++;
  } catch (err) {
    if (err.details?.some(d => d.field === 'password')) {
      console.log('✅ Test 2 Passed: Weak password (<8 chars) rejected correctly');
      passed++;
    } else {
      console.error('❌ Test 2 Failed: Unexpected error', err);
      failed++;
    }
  }

  // Test 3: Validation - Reject missing letter/number in password
  try {
    validateRegister({ email: 'test@example.com', password: 'passwordonly', displayName: 'Test User' });
    console.error('❌ Test 3 Failed: Password without number was accepted');
    failed++;
  } catch (err) {
    if (err.details?.some(d => d.field === 'password')) {
      console.log('✅ Test 3 Passed: Password without numbers rejected correctly');
      passed++;
    } else {
      console.error('❌ Test 3 Failed: Unexpected error', err);
      failed++;
    }
  }

  // Test 4: Validation - Valid registration payload
  try {
    const validated = validateRegister({
      email: '  USER@Example.COM  ',
      password: 'SecurePass123',
      displayName: '  John Doe  ',
    });
    if (validated.email === 'user@example.com' && validated.displayName === 'John Doe') {
      console.log('✅ Test 4 Passed: Valid registration sanitized and trimmed');
      passed++;
    } else {
      console.error('❌ Test 4 Failed: Sanitization error', validated);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 4 Failed:', err);
    failed++;
  }

  // Test 5: JWT generation and verification
  try {
    const payload = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com' };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    if (decoded.id === payload.id && decoded.email === payload.email) {
      console.log('✅ Test 5 Passed: JWT generation and verification succeeded');
      passed++;
    } else {
      console.error('❌ Test 5 Failed: Payload mismatch', decoded);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 5 Failed:', err);
    failed++;
  }

  // Test 6: Password Hashing with Bcrypt
  try {
    const plain = 'MySecret123';
    const hash = await bcrypt.hash(plain, 12);
    const matches = await bcrypt.compare(plain, hash);
    const wrongMatches = await bcrypt.compare('WrongSecret123', hash);
    if (matches && !wrongMatches) {
      console.log('✅ Test 6 Passed: Bcrypt hashing and comparison verified');
      passed++;
    } else {
      console.error('❌ Test 6 Failed: Bcrypt match mismatch');
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

runTests();
