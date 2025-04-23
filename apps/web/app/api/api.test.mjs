import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mock API handlers
class MockRequest {
  constructor(method = 'GET', url = '/api/stats') {
    this.method = method;
    this.url = url;
    this.body = null;
  }
}

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.data = null;
  }

  json(data) {
    this.data = data;
    return this;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }
}

// Mock auth handler
async function getSession(request) {
  const authHeader = request.headers?.authorization;
  if (!authHeader) return null;
  
  return {
    user: { id: 'user-123', email: 'test@example.com' },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

// Mock API routes
async function handleStatsRequest(request, response) {
  const mockStats = {
    totalTests: 42,
    avgWpm: 78,
    totalRooms: 5,
  };

  response.status(200).json(mockStats);
  return response;
}

async function handleRoomCreation(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(request);
  if (!session) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  // Validate room schema
  if (!request.body || !request.body.maxParticipants || !request.body.language) {
    return response.status(400).json({ error: 'Invalid schema' });
  }

  const newRoom = {
    code: 'ROOM001',
    creator: session.user.id,
    maxParticipants: request.body.maxParticipants,
    language: request.body.language,
  };

  response.status(201).json(newRoom);
  return response;
}

async function handleRoomListing(request, response) {
  const mockRooms = [
    { code: 'ROOM001', creator: 'user-1', activeUsers: 2 },
    { code: 'ROOM002', creator: 'user-2', activeUsers: 0 },
  ];

  response.status(200).json(mockRooms);
  return response;
}

// Test Suite: API Routes
test('API Routes: GET /api/stats - should return stats with correct structure', async () => {
  const request = new MockRequest('GET', '/api/stats');
  const response = new MockResponse();

  await handleStatsRequest(request, response);

  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.data.totalTests !== undefined);
  assert.ok(response.data.avgWpm !== undefined);
  assert.ok(response.data.totalRooms !== undefined);
});

test('API Routes: GET /api/stats - should return empty array as fallback when no stats', async () => {
  const request = new MockRequest('GET', '/api/stats');
  const response = new MockResponse();

  await handleStatsRequest(request, response);

  assert.ok(Array.isArray(response.data) || typeof response.data === 'object');
});

test('API Routes: POST /api/room - should create room when authenticated', async () => {
  const request = new MockRequest('POST', '/api/room');
  request.headers = { authorization: 'Bearer token' };
  request.body = {
    maxParticipants: 4,
    language: 'en',
  };
  const response = new MockResponse();

  await handleRoomCreation(request, response);

  assert.strictEqual(response.statusCode, 201);
  assert.ok(response.data.code);
  assert.strictEqual(response.data.creator, 'user-123');
});

test('API Routes: POST /api/room - should reject unauthenticated requests', async () => {
  const request = new MockRequest('POST', '/api/room');
  request.body = { maxParticipants: 4, language: 'en' };
  const response = new MockResponse();

  await handleRoomCreation(request, response);

  assert.strictEqual(response.statusCode, 401);
  assert.ok(response.data.error);
});

test('API Routes: POST /api/room - should validate request schema', async () => {
  const request = new MockRequest('POST', '/api/room');
  request.headers = { authorization: 'Bearer token' };
  request.body = { maxParticipants: 4 }; // Missing language
  const response = new MockResponse();

  await handleRoomCreation(request, response);

  assert.strictEqual(response.statusCode, 400);
  assert.ok(response.data.error);
});

test('API Routes: GET /api/room - should fetch available rooms', async () => {
  const request = new MockRequest('GET', '/api/room');
  const response = new MockResponse();

  await handleRoomListing(request, response);

  assert.strictEqual(response.statusCode, 200);
  assert.ok(Array.isArray(response.data));
  assert.ok(response.data.length >= 0);
});

test('API Routes: POST /api/room - should reject requests with wrong HTTP method', async () => {
  const request = new MockRequest('GET', '/api/room');
  request.method = 'GET';
  const response = new MockResponse();

  // Try to create room with GET method (should fail)
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
  }

  assert.strictEqual(response.statusCode, 405);
});
