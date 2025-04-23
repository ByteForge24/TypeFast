# Testing Patterns and Best Practices

## Test Assertion Patterns

### 1. Equality Assertions

#### Strict Equality
```javascript
// Best for: primitive values and types
test('should return correct value', () => {
  const result = getValue();
  assert.strictEqual(result, expectedValue);
});
```

#### Deep Equality
```javascript
// Best for: objects and arrays
test('should return correct object', () => {
  const result = getObject();
  assert.deepStrictEqual(result, expectedObject);
});
```

### 2. Truthiness Assertions

#### Boolean Check
```javascript
test('should be valid', () => {
  const isValid = validateInput(data);
  assert.ok(isValid); // Must be truthy
});
```

#### Not Check
```javascript
test('should not be empty', () => {
  const list = getList();
  assert.ok(list.length > 0); // Must be truthy
});
```

### 3. Pattern Matching

#### Regex Match
```javascript
test('should have valid email format', () => {
  const email = 'user@example.com';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.match(email, emailRegex);
});
```

#### String Inclusion
```javascript
test('should contain expected text', () => {
  const message = 'Login successful';
  assert.ok(message.includes('successful'));
});
```

### 4. Error Assertions

#### Throwing Error
```javascript
test('should throw on invalid input', () => {
  assert.throws(() => {
    throwError();
  });
});
```

#### Specific Error Type
```javascript
test('should throw TypeError', () => {
  assert.throws(
    () => { nullValue.method(); },
    TypeError
  );
});
```

### 5. Array/Collection Assertions

#### Array Inclusion
```javascript
test('should have item in array', () => {
  const items = ['a', 'b', 'c'];
  assert.ok(items.includes('b'));
});
```

#### Array Length
```javascript
test('should have correct length', () => {
  const items = getItems();
  assert.strictEqual(items.length, 3);
});
```

#### Array Range
```javascript
test('should have items within range', () => {
  const items = getItems();
  assert.ok(items.length > 0 && items.length < 100);
});
```

## Common Test Patterns

### Pattern 1: Input Validation

```javascript
test('should validate email format', () => {
  // Arrange
  const validEmail = 'user@example.com';
  const invalidEmail = 'notanemail';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Act & Assert
  assert.match(validEmail, emailRegex);
  assert.throws(() => {
    if (!emailRegex.test(invalidEmail)) {
      throw new Error('Invalid email');
    }
  });
});
```

### Pattern 2: Data Transformation

```javascript
test('should transform user data correctly', () => {
  // Arrange
  const input = { firstName: 'John', lastName: 'Doe' };
  const expected = { name: 'John Doe' };

  // Act
  const result = transformUser(input);

  // Assert
  assert.deepStrictEqual(result, expected);
});
```

### Pattern 3: State Changes

```javascript
test('should update state correctly', () => {
  // Arrange
  const initialState = { count: 0 };

  // Act
  const newState = incrementCount(initialState);

  // Assert
  assert.strictEqual(newState.count, 1);
  assert.strictEqual(initialState.count, 0); // Original unchanged
});
```

### Pattern 4: Conditional Logic

```javascript
test('should return correct value based on condition', () => {
  // Test true condition
  const resultTrue = getResult(true);
  assert.strictEqual(resultTrue, expectedTrueValue);

  // Test false condition
  const resultFalse = getResult(false);
  assert.strictEqual(resultFalse, expectedFalseValue);
});
```

### Pattern 5: Error Handling

```javascript
test('should handle error gracefully', () => {
  // Arrange
  const invalidInput = { /* ... */ };

  // Act & Assert
  assert.throws(() => {
    processInput(invalidInput);
  }, Error);
});
```

### Pattern 6: Boundary Testing

```javascript
test('should handle boundary values', () => {
  // Minimum value
  assert.ok(isValid(0));

  // Maximum value
  assert.ok(isValid(100));

  // Below minimum
  assert.throws(() => isValid(-1));

  // Above maximum
  assert.throws(() => isValid(101));
});
```

### Pattern 7: Performance Testing

```javascript
test('should complete within time limit', () => {
  const startTime = performance.now();
  const result = processLargeDataset();
  const duration = performance.now() - startTime;

  assert.ok(duration < 1000); // 1 second
  assert.ok(result.length > 0);
});
```

### Pattern 8: Collection Iteration

```javascript
test('should process all items', () => {
  const items = getItems();
  const processed = items.map(transformItem);

  // Verify count
  assert.strictEqual(processed.length, items.length);

  // Verify each item
  processed.forEach((item, index) => {
    assert.ok(item.id === items[index].id);
  });
});
```

## Component Testing Patterns

### Pattern: Component Rendering

```javascript
test('ComponentName - should render correctly', () => {
  // Arrange
  const props = { title: 'Test', isActive: true };

  // Act
  const component = renderComponent(props);

  // Assert
  assert.ok(component.querySelector('.title').textContent === 'Test');
  assert.ok(component.classList.contains('active'));
});
```

### Pattern: User Interaction

```javascript
test('should handle user interaction', () => {
  // Arrange
  const component = renderComponent();
  const button = component.querySelector('button');
  const spy = createSpy();

  // Act
  button.addEventListener('click', spy);
  button.click();

  // Assert
  assert.strictEqual(spy.callCount, 1);
});
```

### Pattern: Form Submission

```javascript
test('should submit form with valid data', () => {
  // Arrange
  const form = renderForm();
  const input = form.querySelector('input[name="email"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Act
  input.value = 'test@example.com';
  submitBtn.click();

  // Assert
  assert.ok(getSubmittedData().email === 'test@example.com');
});
```

### Pattern: Conditional Rendering

```javascript
test('should render based on props', () => {
  // Arrange & Act
  const component1 = renderComponent({ isLoggedIn: true });
  const component2 = renderComponent({ isLoggedIn: false });

  // Assert
  assert.ok(component1.querySelector('.greeting'));
  assert.throws(() => {
    component2.querySelector('.greeting');
  });
});
```

## API Testing Patterns

### Pattern: Successful Response

```javascript
test('GET /api/users/:id - should return user', () => {
  // Arrange
  const userId = 'user_123';

  // Act
  const response = callAPI('GET', `/api/users/${userId}`);

  // Assert
  assert.strictEqual(response.statusCode, 200);
  assert.ok(response.body.id === userId);
  assert.ok(response.body.email);
});
```

### Pattern: Error Response

```javascript
test('GET /api/users/:id - should return 404 for missing user', () => {
  // Arrange
  const unknownId = 'unknown_999';

  // Act
  const response = callAPI('GET', `/api/users/${unknownId}`);

  // Assert
  assert.strictEqual(response.statusCode, 404);
  assert.match(response.body.message, /not found/i);
});
```

### Pattern: Data Validation

```javascript
test('POST /api/users - should validate email', () => {
  // Arrange
  const invalidPayload = {
    email: 'notanemail',
    password: 'pass123'
  };

  // Act
  const response = callAPI('POST', '/api/users', invalidPayload);

  // Assert
  assert.strictEqual(response.statusCode, 400);
  assert.match(response.body.message, /invalid email/i);
});
```

### Pattern: Data Transformation

```javascript
test('POST /api/users - should store hashed password', () => {
  // Arrange
  const payload = {
    email: 'user@example.com',
    password: 'plaintext'
  };

  // Act
  const response = callAPI('POST', '/api/users', payload);

  // Assert
  assert.strictEqual(response.statusCode, 201);
  assert.ok(response.body.passwordHash !== 'plaintext');
  assert.ok(response.body.passwordHash.length > 20);
});
```

## Workflow Testing Patterns

### Pattern: Multi-Step Flow

```javascript
test('should complete full user registration', () => {
  // Step 1: Navigate to signup
  const signupPage = navigate('/signup');
  assert.ok(signupPage.querySelector('form'));

  // Step 2: Fill form
  const form = signupPage.querySelector('form');
  form.querySelector('input[name="email"]').value = 'user@example.com';
  form.querySelector('input[name="password"]').value = 'Pass123!';

  // Step 3: Submit
  form.querySelector('button[type="submit"]').click();
  assert.ok(getPageTitle() === 'Verification');

  // Step 4: Verify email
  const token = getEmailVerificationToken();
  navigate(`/verify?token=${token}`);
  assert.ok(getPageTitle() === 'Success');
});
```

### Pattern: State Progression

```javascript
test('should progress through states correctly', () => {
  // Initial state
  let state = { status: 'idle' };
  assert.strictEqual(state.status, 'idle');

  // After start
  state = startProcess(state);
  assert.strictEqual(state.status, 'running');

  // After completion
  state = completeProcess(state);
  assert.strictEqual(state.status, 'completed');
});
```

## Testing Anti-Patterns (What NOT to Do)

### ❌ Don't: Test Implementation Details

```javascript
// BAD - Tests implementation detail
test('should use processData function', () => {
  assert.ok(component.processData.called);
});

// GOOD - Tests behavior
test('should display processed data', () => {
  assert.ok(component.textContent.includes('expected data'));
});
```

### ❌ Don't: Test Multiple Concerns

```javascript
// BAD - Tests multiple things
test('should validate and save user', () => {
  const result = validateAndSave(userData);
  assert.ok(result.isValid && result.isSaved);
});

// GOOD - Focus on one concern
test('should validate user data', () => {
  const result = validateUser(userData);
  assert.ok(result.isValid);
});

test('should save valid user data', () => {
  const result = saveUser(userData);
  assert.ok(result.isSaved);
});
```

### ❌ Don't: Use Magic Numbers

```javascript
// BAD - What does 42 mean?
test('should process items', () => {
  const result = process(items);
  assert.strictEqual(result, 42);
});

// GOOD - Clear intent
test('should process all items', () => {
  const expectedCount = items.length;
  const result = process(items);
  assert.strictEqual(result.length, expectedCount);
});
```

### ❌ Don't: Test External Dependencies Directly

```javascript
// BAD - Testing the library, not your code
test('should use lodash correctly', () => {
  const result = _.map([1, 2, 3], x => x * 2);
  assert.deepStrictEqual(result, [2, 4, 6]);
});

// GOOD - Mock the dependency
test('should transform items correctly', () => {
  const mockMap = mock.fn((arr, fn) => arr.map(fn));
  const result = transformItems([1, 2, 3], mockMap);
  assert.ok(mockMap.mock.callCount() > 0);
});
```

### ❌ Don't: Make Tests Interdependent

```javascript
// BAD - Tests depend on order
let userId;
test('create user', () => {
  userId = createUser(data);
});
test('get user', () => {
  const user = getUser(userId); // Depends on previous test
  assert.ok(user);
});

// GOOD - Tests are independent
test('create user', () => {
  const userId = createUser(data);
  assert.ok(userId);
});

test('get user', () => {
  const userId = createUser(data); // Arrange in every test
  const user = getUser(userId);
  assert.ok(user);
});
```

## Assertion Library Quick Reference

```javascript
import assert from 'node:assert/strict';

// Basic checks
assert.ok(value)                          // Truthy
assert.strictEqual(value, expected)       // Equality
assert.deepStrictEqual(obj1, obj2)        // Deep equality
assert.notStrictEqual(value, expected)    // Not equal

// String/Regex
assert.match(string, regex)               // Regex match
assert.doesNotMatch(string, regex)        // Regex no match

// Type checking
assert.strictEqual(typeof val, 'string')  // Type check
assert.strictEqual(val instanceof Type, true) // Instance

// Errors
assert.throws(() => func())               // Should throw
assert.doesNotThrow(() => func())         // Should not throw

// Arrays/Objects
assert.ok(array.includes(item))           // Array includes
assert.strictEqual(array.length, 5)       // Length
assert.ok('key' in object)                // Property exists
```

## Performance Testing Patterns

### Pattern: Measure Execution Time

```javascript
test('should complete within time limit', () => {
  const startTime = performance.now();

  // Execute test
  const result = performOperation();

  const duration = performance.now() - startTime;

  assert.ok(duration < 1000); // Must complete in 1 second
  assert.ok(result.success);
});
```

### Pattern: Benchmark Comparison

```javascript
test('should be faster than threshold', () => {
  const times = [];

  for (let i = 0; i < 1000; i++) {
    const start = performance.now();
    operation();
    times.push(performance.now() - start);
  }

  const avgTime = times.reduce((a, b) => a + b) / times.length;
  assert.ok(avgTime < 10); // Average < 10ms
});
```

## Summary

- **Keep tests focused** - One assertion or concern per test
- **Use descriptive names** - Test name explains what is tested
- **Follow AAA pattern** - Arrange, Act, Assert
- **Test behavior, not implementation** - What the code does, not how
- **Make tests independent** - Can run in any order
- **Use clear assertions** - Easy to understand what failed
- **Avoid test duplication** - DRY principle applies to tests
- **Document complex logic** - Comments for non-obvious tests

---

**Last Updated:** 2024
**For TypeFast Test Suite**
