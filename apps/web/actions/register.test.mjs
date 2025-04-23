import { test } from 'node:test';
import assert from 'node:assert/strict';

// Simple email validator
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Simple password validator
function isValidPassword(password) {
  return password && password.length >= 8;
}

// Mock database for registration
const mockDatabase = new Map();

async function registerUser(email, password, passwordConfirm, name) {
  // Validate email
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email format' };
  }

  // Check for duplicates
  if (mockDatabase.has(email)) {
    return { success: false, error: 'User already exists' };
  }

  // Validate password
  if (!isValidPassword(password)) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  // Validate password match
  if (password !== passwordConfirm) {
    return { success: false, error: 'Passwords do not match' };
  }

  // Create user
  const user = {
    id: `user-${Date.now()}`,
    email,
    name,
    password: `hashed-${password}`, // Simulated hash
    emailVerified: null,
    createdAt: new Date(),
  };

  mockDatabase.set(email, user);
  return { success: true, user };
}

// Test Suite: User Registration
test('Registration: User registration - should successfully register a new user', async () => {
  const result = await registerUser(
    'newuser@example.com',
    'SecurePass123',
    'SecurePass123',
    'New User'
  );

  assert.strictEqual(result.success, true);
  assert.ok(result.user);
  assert.strictEqual(result.user.email, 'newuser@example.com');
  assert.strictEqual(result.user.name, 'New User');
});

test('Registration: User registration - should reject duplicate email', async () => {
  // Pre-register a user
  await registerUser('duplicate@example.com', 'Pass123456', 'Pass123456', 'Duplicate');

  // Try to register again with same email
  const result = await registerUser(
    'duplicate@example.com',
    'AnotherPass789',
    'AnotherPass789',
    'Another User'
  );

  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('already exists'));
});

test('Registration: User registration - should validate email format', async () => {
  const result = await registerUser(
    'invalidemail',
    'SecurePass123',
    'SecurePass123',
    'Invalid User'
  );

  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('Invalid email'));
});

test('Registration: User registration - should require valid password', async () => {
  const result = await registerUser(
    'user@example.com',
    'short',
    'short',
    'User'
  );

  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('at least 8 characters'));
});

test('Registration: User registration - should require matching password confirm', async () => {
  const result = await registerUser(
    'user@example.com',
    'SecurePass123',
    'DifferentPass456',
    'User'
  );

  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('do not match'));
});

test('Registration: User registration - should handle registration errors gracefully', async () => {
  const result = await registerUser(
    '',
    '',
    '',
    ''
  );

  assert.strictEqual(result.success, false);
  assert.ok(result.error);
});
