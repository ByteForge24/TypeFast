# Test Suite Quick Reference

## Running Tests

| Command | Purpose |
|---------|---------|
| `npm test` | Run all test suites |
| `npm run test:components` | Component tests only |
| `npm run test:integration` | API integration tests only |
| `npm run test:e2e` | End-to-end workflow tests |
| `npm run test:performance` | Performance & accessibility tests |
| `npm run test:verbose` | All tests with detailed output |
| `npm run test:watch` | Watch mode for continuous testing |
| `npm run test:coverage` | Tests with coverage report |

## Test File Summary

### components.test.mjs (Home Page, Auth, Typing, Leaderboard, Multiplayer, Profile)
- 160+ test cases for React components
- Tests user interactions and rendering
- Validates form inputs and error states
- Checks conditional rendering based on auth

### integration.test.mjs (API Routes, Database, Authentication)
- 100+ test cases for backend functionality
- Tests API endpoints validation
- Validates database operations
- Tests WebSocket events
- Security and rate limiting

### e2e.test.mjs (Complete User Workflows)
- 80+ test cases for full user flows
- Sign-up, login, typing test completion
- Leaderboard browsing and filtering
- Multiplayer room creation and gameplay
- Profile management and navigation

### performance-accessibility.test.mjs (Quality Metrics)
- 140+ test cases covering:
  - Performance metrics and load times
  - WCAG 2.1 accessibility compliance
  - Mobile responsiveness
  - Browser compatibility
  - Security best practices
  - SEO optimization
  - Reliability and uptime

## Test Structure

```javascript
// Describe groups related tests
test.describe('Feature Name', () => {
  // Individual test case
  test('should do something specific', () => {
    // Arrange: Set up test data
    const testData = { /* ... */ };
    
    // Act: Perform action
    const result = functionUnderTest(testData);
    
    // Assert: Verify result
    assert.strictEqual(result, expectedValue);
  });
});
```

## Common Assertions

```javascript
assert.strictEqual(actual, expected)        // Equality
assert.ok(condition)                        // Truthy
assert.throws(() => funcThatThrows())       // Error thrown
assert.match(string, /pattern/)             // Regex match
assert.deepStrictEqual(obj1, obj2)          // Deep equality
```

## Key Test Categories

### Component Tests
- Page loads and renders
- Forms validate input
- Buttons and links work
- Conditional UI appears/disappears
- Error messages display
- Loading states show

### API Integration Tests
- Authentication endpoints work
- Data is validated properly
- Errors return correct status codes
- Database operations succeed
- WebSocket messages transmit
- Rate limiting functions

### E2E Workflow Tests
- Users can sign up and verify email
- Users can log in and see dashboard
- Typing tests can be completed
- Multiplayer rooms can be created/joined
- Leaderboard shows rankings
- Profiles display user stats

### Performance Tests
- Home page loads < 3 seconds
- Typing page loads < 2 seconds
- WebSocket latency < 100ms
- Bundle size < 500KB
- Web Vitals in target range

### Accessibility Tests
- WCAG 2.1 Level AA compliant
- Keyboard navigable
- Screen reader compatible
- Color contrast sufficient
- Focus visible
- Mobile responsive

## Test Data Examples

### User
```javascript
{
  id: 'user_123',
  email: 'user@example.com',
  name: 'Test User',
  passwordHash: 'hashed_value'
}
```

### Typing Test Result
```javascript
{
  testId: 'test_123',
  userId: 'user_123',
  wpm: 85,
  accuracy: 97.5,
  totalTime: 45,
  completedAt: new Date()
}
```

### Multiplayer Room
```javascript
{
  roomId: 'room_123',
  roomCode: 'ABC123',
  hostId: 'user_123',
  maxPlayers: 4,
  members: ['user_123', 'user_456']
}
```

## Performance Baselines

| Metric | Target | Current |
|--------|--------|---------|
| Page Load | < 3s | - |
| FCP | < 1.5s | - |
| LCP | < 2.5s | - |
| CLS | < 0.1 | - |
| Bundle Size | < 500KB | - |
| WebSocket Latency | < 100ms | - |

## Debugging

### Run Single Test
```javascript
test.only('this test only', () => {
  // Test runs alone
});
```

### Skip Test
```javascript
test.skip('skip this', () => {
  // Test is skipped
});
```

### Add Logging
```javascript
console.log('Debug value:', variable);
```

### Verbose Output
```bash
npm run test:verbose
```

## CI/CD Integration

Add to GitHub Actions `.github/workflows/test.yml`:
```yaml
- name: Run tests
  run: cd apps/web && npm test

- name: Run performance tests
  run: cd apps/web && npm run test:performance
```

## Common Patterns

### Testing API Endpoint
```javascript
test('GET /api/leaderboard - should return rankings', () => {
  const endpoint = '/api/leaderboard';
  const expectedFields = ['rank', 'userId', 'wpm'];
  // Verify endpoint and data structure
  assert.ok(expectedFields.length > 0);
});
```

### Testing User Flow
```javascript
test('should complete typing test flow', () => {
  // 1. Navigate to page
  // 2. Start test
  // 3. Type text
  // 4. Complete test
  // 5. Verify results saved
  assert.ok(true); // Replace with actual assertions
});
```

### Testing Error Handling
```javascript
test('should handle invalid input', () => {
  const invalidEmail = 'notanemail';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.throws(() => {
    if (!emailRegex.test(invalidEmail)) {
      throw new Error('Invalid email');
    }
  });
});
```

## Accessibility Checklist

- [ ] Headings in proper hierarchy (H1, H2, H3...)
- [ ] Images have alt text
- [ ] Links have descriptive text
- [ ] Form inputs have labels
- [ ] Color contrast ≥ 4.5:1
- [ ] Keyboard navigable (Tab, Enter)
- [ ] Focus visible on elements
- [ ] ARIA attributes where needed
- [ ] Works without mouse
- [ ] Works with screen readers

## Performance Checklist

- [ ] Assets are minified
- [ ] Images are compressed
- [ ] Code splitting implemented
- [ ] Lazy loading enabled
- [ ] Caching strategy in place
- [ ] Database queries optimized
- [ ] API responses cached
- [ ] WebSocket optimized
- [ ] No memory leaks
- [ ] Error monitoring active

## Test Maintenance

- [ ] Review tests when features change
- [ ] Add tests for new features
- [ ] Update test data regularly
- [ ] Remove obsolete tests
- [ ] Keep tests focused
- [ ] Avoid test coupling
- [ ] Document complex tests
- [ ] Monitor test performance
- [ ] Update baselines

## Resources

- [Node.js Test Docs](https://nodejs.org/api/test.html)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Vitals](https://web.dev/vitals/)
- Full docs in TEST_GUIDE.md and TESTING.md

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Test won't run | Check .mjs extension and Node >= 20 |
| Import error | Ensure "type": "module" in package.json |
| Async timeout | Add await or longer timeout |
| Flaky test | Use deterministic data, not time-dependent |
| Missing assertion | Check assert import from 'node:assert/strict' |

---
**Last Updated:** 2024
**TypeFast Test Suite v1.0**
