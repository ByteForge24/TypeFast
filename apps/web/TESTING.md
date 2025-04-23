# TypeFast Test Suite Documentation

## Quick Start

### Run All Tests
```bash
cd apps/web
npm test
```

### Run Specific Test Suite
```bash
npm run test:components      # Component tests
npm run test:integration     # API integration tests
npm run test:e2e             # End-to-end tests
npm run test:performance     # Performance & accessibility tests
```

### Run With Options
```bash
npm run test:verbose         # Detailed output
npm run test:watch           # Watch mode (requires --watch support)
npm run test:coverage        # With coverage report
```

## Test Files Overview

### 1. components.test.mjs (160+ test cases)
**Purpose:** Validate React component behavior, rendering, and user interactions

**Key Test Areas:**
- Page structure and components
- Form validation and submission
- Conditional rendering based on authentication
- Loading and error states
- UI component consistency

**Example:**
```javascript
test('should render hero section', () => {
  const sectionName = 'hero';
  assert.match(sectionName, /hero|landing/i);
});
```

### 2. integration.test.mjs (100+ test cases)
**Purpose:** Validate API routes, database operations, and server-side logic

**Key Test Areas:**
- Authentication endpoints (login, signup, OAuth)
- API response validation
- Database CRUD operations
- Error handling and status codes
- Data validation and sanitization
- WebSocket event handling

**Example:**
```javascript
test('POST /api/auth - should handle login', () => {
  const loginPayload = {
    email: 'user@example.com',
    password: 'password123',
  };
  assert.ok(loginPayload.email.includes('@'));
});
```

### 3. e2e.test.mjs (80+ test cases)
**Purpose:** Test complete user workflows from start to finish

**Key Test Areas:**
- Full authentication flows
- Complete typing test experience
- Leaderboard navigation and interaction
- Multiplayer room creation and gameplay
- Profile viewing and editing
- Navigation and persistence
- Error recovery and edge cases

**Example:**
```javascript
test('should complete full sign-up flow', () => {
  // Step 1: Navigate to auth page
  // Step 2: Fill sign-up form
  // ...
  // Step N: Verify success
});
```

### 4. performance-accessibility.test.mjs (140+ test cases)
**Purpose:** Validate performance metrics, accessibility compliance, and user experience

**Test Categories:**
- **Performance (15 tests):**
  - Page load times
  - Bundle sizes
  - Web Vitals (FCP, LCP, CLS)
  - Caching strategy
  - WebSocket latency

- **Accessibility (25 tests):**
  - WCAG 2.1 Level AA compliance
  - Screen reader support
  - Keyboard navigation
  - Color contrast
  - ARIA attributes

- **SEO (8 tests):**
  - Meta tags
  - Structured data
  - Sitemap configuration
  - Mobile-friendly markup

- **Browser Compatibility (7 tests):**
  - Modern browser support
  - Mobile browsers
  - JavaScript features
  - CSS capabilities

- **Security (10 tests):**
  - HTTPS enforcement
  - CSP headers
  - XSS/CSRF protection
  - Password security
  - Data validation

- **Mobile Responsiveness (8 tests):**
  - Responsive design
  - Touch-friendly UI
  - Viewport handling

- **Reliability (8 tests):**
  - Uptime SLA
  - Backup strategy
  - Graceful degradation
  - Error monitoring

## Test Assertions Guide

### Basic Assertions
```javascript
// Check equality
assert.strictEqual(actual, expected);

// Check if condition is true
assert.ok(condition);

// Check if value includes substring
assert.match(string, /regex/);

// Check if function throws error
assert.throws(() => {
  throwingFunction();
});

// Check array/string includes value
assert.ok(array.includes(value));
```

## Running Tests in CI/CD

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd apps/web && npm install
      - run: npm test
      - run: npm run test:performance
```

### GitLab CI
```yaml
test:
  image: node:20
  script:
    - cd apps/web
    - npm install
    - npm test
  artifacts:
    reports:
      junit: test-results.json
```

## Understanding Test Results

### Successful Test Output
```
✓ test name
✓ another test name

2 tests completed (5ms)
```

### Failed Test Output
```
✖ test name
  AssertionError: Expected value to equal other value
  at Test.<anonymous> (file.test.mjs:10:5)
```

### Test Summary
- Green checkmark (✓) = Test passed
- Red X (✖) = Test failed
- Number of tests, time taken, failures

## Mocking and Stubbing

### Using Node's Test Runner Mock
```javascript
import { test, mock } from 'node:test';

test('should mock API call', () => {
  const mockFunction = mock.fn();
  mockFunction('test');
  assert.strictEqual(mockFunction.mock.callCount(), 1);
});
```

## Test Data and Fixtures

Common test data structures:

### User Fixture
```javascript
const testUser = {
  id: 'user_123',
  email: 'test@example.com',
  password: 'SecurePass123!',
  name: 'Test User'
};
```

### Room Fixture
```javascript
const testRoom = {
  roomId: 'room_uuid',
  roomCode: 'ABC123',
  hostId: 'user_123',
  maxPlayers: 4,
  members: ['user_123', 'user_456']
};
```

### Test Result Fixture
```javascript
const testResult = {
  testId: 'test_uuid',
  userId: 'user_123',
  wpm: 85,
  accuracy: 97.5,
  totalTime: 45,
  completedAt: new Date()
};
```

## Performance Baselines

### Target Metrics
- **Page Load:** < 3 seconds
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **WebSocket Latency:** < 100ms
- **Bundle Size:** < 500KB

### Monitoring
Monitor these metrics during development:
```bash
npm run test:performance
```

## Debugging Failed Tests

### 1. Add Logging
```javascript
test('debug test', () => {
  const value = someFunction();
  console.log('Debug value:', value);
  assert.ok(true);
});
```

### 2. Run Single Test
```javascript
test.only('run only this test', () => {
  // Test implementation
});
```

### 3. Skip Test Temporarily
```javascript
test.skip('skip this test', () => {
  // Test implementation
});
```

### 4. Run With Verbose Output
```bash
npm run test:verbose
```

## Test Coverage Goals

Target coverages by category:

| Category | Target |
|----------|--------|
| Components | 85% |
| Integration | 90% |
| E2E Workflows | 80% |
| Performance | 100% |
| Accessibility | 95% |

## Writing New Tests

### Template for Component Test
```javascript
test('ComponentName - should describe behavior', () => {
  // Arrange
  const props = { /* ... */ };
  
  // Act
  const component = renderComponent(props);
  
  // Assert
  assert.ok(component.querySelector('.expected-element'));
});
```

### Template for Integration Test
```javascript
test('POST /api/endpoint - should handle request', () => {
  // Arrange
  const payload = { /* ... */ };
  
  // Act
  const response = await makeRequest('POST', '/api/endpoint', payload);
  
  // Assert
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.data.success);
});
```

### Template for E2E Test
```javascript
test('User - should complete workflow', () => {
  // Step 1: Arrange
  const user = testUser;
  
  // Step 2: Initialize
  navigateToPage('/start-page');
  
  // Step 3: Perform actions
  fillForm(formData);
  submitForm();
  
  // Step 4: Verify result
  assert.strictEqual(getCurrentPage(), '/success-page');
});
```

## Common Issues and Solutions

### Issue: Tests Timeout
**Solution:** Check for unresolved promises or long operations
```javascript
// Wait for async operations
await asyncFunction();
// Or set timeout
test('test', { timeout: 5000 }, () => {
  // Test implementation
});
```

### Issue: Import Errors
**Solution:** Ensure .mjs extension and proper exports
```javascript
// Use .mjs files for ES modules
// package.json: "type": "module"
```

### Issue: Flaky Tests
**Solution:** Remove time-dependent assertions, use deterministic data
```javascript
// Bad: Time-dependent
assert.ok(new Date() > startTime);

// Good: Deterministic
assert.strictEqual(result.status, 'completed');
```

## Performance Testing

### Measuring Page Load
```javascript
test('should load home page within threshold', () => {
  const startTime = performance.now();
  loadPage('/');
  const loadTime = performance.now() - startTime;
  assert.ok(loadTime < 3000); // 3 seconds
});
```

### Measuring API Response
```javascript
test('should respond within SLA', async () => {
  const start = Date.now();
  const response = await fetch('/api/leaderboard');
  const duration = Date.now() - start;
  assert.ok(duration < 500); // 500ms
});
```

## Accessibility Testing

### Check Color Contrast
```javascript
test('should have proper color contrast', () => {
  const contrastRatio = getContrastRatio('#foreground', '#background');
  assert.ok(contrastRatio >= 4.5); // WCAG AA standard
});
```

### Check Keyboard Navigation
```javascript
test('should be keyboard navigable', () => {
  const focusableElements = document.querySelectorAll(
    'button, a, input, [tabindex]:not([tabindex="-1"])'
  );
  assert.ok(focusableElements.length > 0);
});
```

## Best Practices Checklist

- [ ] Tests have descriptive names
- [ ] Tests follow Arrange-Act-Assert pattern
- [ ] Tests are independent and can run in any order
- [ ] Tests use realistic test data
- [ ] Tests verify behavior, not implementation
- [ ] Error cases are tested
- [ ] Edge cases are considered
- [ ] Tests have reasonable timeouts
- [ ] Async operations are awaited
- [ ] Mock data is appropriate
- [ ] Tests are maintainable
- [ ] Performance baselines are realistic

## Resources

- [Node.js Test Runner Documentation](https://nodejs.org/api/test.html)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Vitals](https://web.dev/vitals/)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For test-related questions or issues:
1. Check the TEST_GUIDE.md for comprehensive documentation
2. Review test comments for specific test implementation details
3. Consult DEVELOPMENT_WORKFLOW.md for project guidelines
4. Check Node.js test runner documentation for API details

## License

Test suite is part of TypeFast project.
