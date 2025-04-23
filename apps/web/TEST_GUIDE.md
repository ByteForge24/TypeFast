# Test Suite Guide for TypeFast

## Overview

This document provides a comprehensive guide to the test suites created for the TypeFast application. The tests cover component testing, integration testing, end-to-end testing, performance, and accessibility.

## Test Files Created

### 1. **components.test.mjs** - Component & Integration Tests
Test suite validating individual React components and their behaviors.

**Coverage:**
- Home Page Component (hero, features sections)
- Auth Page Component (forms, OAuth, validation)
- Type/Typing Interface (input handling, stats calculation)
- Leaderboard Component (ranking, pagination)
- Multiplayer Component (rooms, members, chat)
- Profile Component (user stats, recent tests, best scores)
- Header/Navigation Component (links, user menu)
- Form Components (validation, errors)
- Loading States
- Conditional Rendering

**To Run:**
```bash
node --test components.test.mjs
```

### 2. **integration.test.mjs** - API Integration Tests
Test suite validating API routes, server-side logic, and data flow.

**Coverage:**
- Auth API Routes (login, signup, OAuth, session tokens)
- Leaderboard API Routes (pagination, caching with Redis, filtering)
- Room API Routes (create, join, validation, state management)
- Stats API Routes (user statistics, calculation)
- Database Integration (CRUD operations, prepared statements)
- Authentication Flow (sessions, JWT tokens, refreshing)
- Error Handling (400, 404, 500 errors)
- Data Validation (email, password, room codes)
- WebSocket Events (progress updates, state changes)
- Performance Tests (caching, rate limiting, pagination)

**To Run:**
```bash
node --test integration.test.mjs
```

### 3. **e2e.test.mjs** - End-to-End Tests
Test suite validating complete user workflows and interactions.

**Coverage:**
- User Authentication Flow (sign-up, sign-in, OAuth, email verification)
- Typing Test Flow (start, progress, completion, statistics)
- Leaderboard View Flow (loading, display, pagination, filtering)
- Multiplayer Room Flow (create, join, race, results)
- Profile View Flow (display, editing, statistics)
- Navigation Flow (page transitions, session persistence)
- Error Scenarios (network errors, session expiration)

**To Run:**
```bash
node --test e2e.test.mjs
```

### 4. **performance-accessibility.test.mjs** - Performance & Accessibility Tests
Test suite for performance metrics, accessibility compliance, and user experience.

**Coverage:**
- **Performance Tests:**
  - Page load times (home, typing, leaderboard)
  - Concurrent user handling
  - Caching strategy (Redis)
  - Bundle size optimization
  - Core Web Vitals (FCP, LCP, CLS)
  - WebSocket latency
  - Asset caching

- **Accessibility Tests:**
  - Page structure (headings, hierarchy)
  - Alternative text for images
  - Link text descriptiveness
  - Color contrast ratios
  - Keyboard navigation
  - Screen reader support
  - ARIA labels and roles
  - Focus visibility

- **SEO Tests:**
  - Meta tags and descriptions
  - Structured data (schema.org)
  - Open Graph tags
  - Sitemap and robots.txt
  - Canonical URLs
  - Mobile-friendly markup

- **Browser Compatibility Tests:**
  - Chrome, Firefox, Safari, Edge
  - Mobile browsers
  - ES6+ support
  - CSS features (Grid, Flexbox)

- **Security Tests:**
  - HTTPS enforcement
  - CSP headers
  - XSS protection
  - CSRF protection
  - Password hashing
  - Secure cookies

- **Mobile Responsiveness Tests:**
  - Viewport sizes (320px, 768px, 1024px)
  - Touch-friendly elements
  - Orientation changes
  - Responsive layouts

- **Reliability Tests:**
  - Uptime SLA (99.9%)
  - Backup strategy
  - Database failover
  - Error monitoring
  - Graceful degradation
  - Circuit breakers

**To Run:**
```bash
node --test performance-accessibility.test.mjs
```

## Running All Tests

### Run all tests at once:
```bash
node --test *.test.mjs
```

### Run with detailed output:
```bash
node --test --reporter=verbose *.test.mjs
```

### Run specific test file:
```bash
node --test components.test.mjs
```

## Test Organization

Tests are organized into logical groups using `test.describe()` for better organization and readability:

```javascript
test.describe('Feature Group Name', () => {
  test('should do something specific', () => {
    // Test implementation
  });
});
```

## Integration with Package.json

Add these scripts to `apps/web/package.json`:

```json
{
  "scripts": {
    "test": "node --test *.test.mjs",
    "test:components": "node --test components.test.mjs",
    "test:integration": "node --test integration.test.mjs",
    "test:e2e": "node --test e2e.test.mjs",
    "test:performance": "node --test performance-accessibility.test.mjs",
    "test:watch": "node --test --watch *.test.mjs",
    "test:coverage": "node --test --coverage *.test.mjs"
  }
}
```

## Test Structure

Each test follows this pattern:

```javascript
test('should describe what is being tested', () => {
  // Arrange - Set up test data
  const testData = { /* ... */ };
  
  // Act - Perform the action
  const result = someFunction(testData);
  
  // Assert - Verify the result
  assert.strictEqual(result, expectedValue);
});
```

## Testing Best Practices

### 1. **Component Testing**
- Test user-visible behavior, not implementation details
- Test forms with realistic user input
- Verify conditional rendering based on auth state
- Test error states and edge cases

### 2. **Integration Testing**
- Test API route behavior
- Verify database operations
- Test authentication flow
- Validate error handling
- Test data transformations

### 3. **End-to-End Testing**
- Follow complete user workflows
- Test across multiple pages
- Verify state persistence
- Test error recovery

### 4. **Performance Testing**
- Measure real-world metrics
- Set realistic thresholds
- Monitor bundle sizes
- Test caching strategies
- Validate Core Web Vitals

### 5. **Accessibility Testing**
- Verify semantic HTML
- Test keyboard navigation
- Check color contrast
- Validate ARIA attributes
- Test screen reader compatibility

## Common Assertions

```javascript
// Equality
assert.strictEqual(actual, expected);

// Inclusion
assert.ok(value.includes(substring));
assert.match(string, /regex/);

// Type checking
assert.strictEqual(typeof variable, 'string');

// Error handling
assert.throws(() => { /* code that should throw */ });
```

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

### GitHub Actions example:
```yaml
- name: Run tests
  run: npm test

- name: Run performance tests
  run: npm run test:performance
```

### GitLab CI example:
```yaml
test:
  script:
    - npm test
```

## Coverage Goals

Aim for:
- **Component Coverage:** 80%+ of components
- **Function Coverage:** 85%+ of functions
- **Line Coverage:** 85%+ of lines
- **Branch Coverage:** 75%+ of branches

## Maintenance

- Update tests when features change
- Add tests for bug fixes
- Review tests during code reviews
- Keep test data realistic
- Remove obsolete tests

## Debugging Tests

### Run single test:
```javascript
test.only('should run this test only', () => {
  // Test implementation
});
```

### Skip test temporarily:
```javascript
test.skip('should skip this test', () => {
  // Test implementation
});
```

### Add console logging:
```javascript
test('should debug', () => {
  console.log('Debug info:', variable);
  assert.ok(true);
});
```

## Test Data Fixtures

For complex tests, consider creating shared test data:

```javascript
const userFixture = {
  id: 'user_123',
  email: 'test@example.com',
  name: 'Test User'
};

const roomFixture = {
  roomId: 'room_123',
  roomCode: 'ABC123',
  hostId: 'user_123',
  maxPlayers: 4
};
```

## Mocking and Stubbing

For unit tests with external dependencies, use Node's built-in mocking:

```javascript
import { mock } from 'node:test';

test('should mock database call', () => {
  const dbMock = mock.fn();
  // Use dbMock in test
});
```

## Performance Metrics to Monitor

- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s
- Total Blocking Time (TBT): < 250ms

## Accessibility WCAG 2.1 Compliance

- Level A: Basic accessibility
- Level AA: Enhanced accessibility (recommended)
- Level AAA: Advanced accessibility (optional)

Current target: **WCAG 2.1 Level AA**

## Key Metrics by Page

### Home Page
- Load time: < 3s
- First Paint: < 1.5s
- Bundle size: < 250KB

### Typing Test Page
- Load time: < 2s
- WebSocket latency: < 100ms
- Real-time updates: 60 FPS

### Leaderboard Page
- Load time: < 2s (cached)
- Load time: < 4s (uncached)
- Pagination response: < 500ms

### Multiplayer Room
- Room creation: < 1s
- Player join: < 2s
- Race sync: < 100ms latency

## Resources

- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Vitals](https://web.dev/vitals/)
- [API Testing Best Practices](https://testingjavascript.com/)

## Support & Questions

For questions or issues with the test suite, refer to the DEVELOPMENT_WORKFLOW.md file or consult the test implementation comments.
