# Plugin Test Suite

Comprehensive test suite for Bruno plugin system, focusing on the BFF_debug trace plugin.

## Test Structure

```
tests/plugins/
├── PluginRegistry.spec.js          # Plugin lifecycle and registry tests
├── trace/
│   ├── BFF_debug.spec.js           # Core plugin functionality tests
│   ├── TraceConfig.spec.js         # React component tests
│   ├── TraceResponse.spec.js       # Response handling tests
│   └── integration/
│       └── trace-flow.spec.js      # End-to-end integration tests
└── README.md
```

## Test Coverage Areas

### 1. PluginRegistry.spec.js
- Plugin registration and deregistration
- Plugin discovery by name/type
- Plugin lifecycle management (initialize, cleanup)
- Error handling for invalid plugins
- Plugin validation

**Coverage Target**: 95%+

### 2. BFF_debug.spec.js
- Core plugin metadata and configuration
- GET request interception logic
- Configuration inheritance (collection → request)
- Trace request creation and URL manipulation
- Response routing to DevTools
- Edge cases (non-GET methods, malformed config, etc.)

**Coverage Target**: 90%+

### 3. TraceConfig.spec.js
- React component rendering
- Form field interactions (checkbox, input)
- Save functionality
- Form validation
- Dropdown selection (if implemented)
- Accessibility compliance
- Error state handling

**Coverage Target**: 90%+

### 4. TraceResponse.spec.js
- Response data display
- JSON formatting
- Duration and timestamp formatting
- Empty/error state handling
- Copy functionality
- Performance with large payloads
- Accessibility

**Coverage Target**: 85%+

### 5. trace-flow.spec.js (Integration)
- Complete trace workflow end-to-end
- Collection-level to request-level inheritance
- Background request triggering
- Response routing to DevTools
- Multiple simultaneous traces
- Network failure handling
- Plugin-registry integration
- Edge cases (special characters, fragments, etc.)

**Coverage Target**: 85%+

## Running Tests

### Run all plugin tests
```bash
npm test -- packages/bruno-app/src/tests/plugins
```

### Run specific test suite
```bash
npm test -- packages/bruno-app/src/tests/plugins/trace/BFF_debug.spec.js
```

### Run with coverage
```bash
npm test -- --coverage packages/bruno-app/src/tests/plugins
```

### Run in watch mode
```bash
npm test -- --watch packages/bruno-app/src/tests/plugins
```

## Test Patterns

### Component Testing Pattern
```javascript
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};
```

### Mock Setup Pattern
```javascript
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();

  // Setup mocks
  mockPlugin = { /* ... */ };
});
```

### Async Testing Pattern
```javascript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

## Mocking Strategy

### External Dependencies
- `fetch` - Mock for network requests
- `PluginRegistry` - Mock for plugin management
- `ThemeProvider` - Provide minimal theme for styled-components

### Component Dependencies
- Mock callbacks: `onChange`, `onSave`, `onClose`
- Mock data: Use realistic test fixtures
- Mock timers: Use `jest.useFakeTimers()` when needed

## Coverage Goals

**Overall Target**: 90%+

- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

## Test Characteristics

### FIRST Principles
- **Fast**: Tests run in <100ms each
- **Isolated**: No dependencies between tests
- **Repeatable**: Same result every time
- **Self-validating**: Clear pass/fail
- **Timely**: Written with implementation

### AAA Pattern
All tests follow Arrange-Act-Assert:
```javascript
it('should do something', () => {
  // Arrange
  const input = setupTestData();

  // Act
  const result = functionUnderTest(input);

  // Assert
  expect(result).toBe(expectedValue);
});
```

## Edge Cases Covered

1. **Null/undefined handling**
   - Missing configuration
   - Null request/response objects
   - Undefined props

2. **Invalid input**
   - Malformed URLs
   - Special characters in parameters
   - Invalid trace configuration

3. **Network failures**
   - Timeout errors
   - 500 status codes
   - Connection failures

4. **Concurrent operations**
   - Multiple simultaneous traces
   - Race conditions
   - Isolation between requests

5. **Boundary values**
   - Empty arrays/objects
   - Very long strings
   - Large payloads

## Integration with CI/CD

Tests are automatically run:
- On every commit (pre-commit hook)
- In pull request checks
- Before production builds

## Updating Tests

When implementation changes:

1. Update test mocks to match new interfaces
2. Add tests for new functionality
3. Remove obsolete tests
4. Update coverage targets if needed
5. Run full test suite to verify

## Troubleshooting

### Tests failing after implementation?
1. Check mock implementations match actual code
2. Verify test data fixtures are realistic
3. Review async/await patterns
4. Check for race conditions

### Coverage not meeting targets?
1. Identify uncovered branches with `--coverage`
2. Add tests for edge cases
3. Test error paths
4. Add integration tests for complex flows

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
