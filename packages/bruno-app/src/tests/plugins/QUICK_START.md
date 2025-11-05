# BFF_debug Plugin Tests - Quick Start Guide

## ⚡ Quick Commands

### Run All Tests
```bash
npm test -- packages/bruno-app/src/tests/plugins
```

### Run with Coverage
```bash
npm test -- --coverage packages/bruno-app/src/tests/plugins
```

### Run Specific Test File
```bash
# Plugin Registry
npm test -- packages/bruno-app/src/tests/plugins/PluginRegistry.spec.js

# Core Plugin
npm test -- packages/bruno-app/src/tests/plugins/trace/BFF_debug.spec.js

# UI Components
npm test -- packages/bruno-app/src/tests/plugins/trace/TraceConfig.spec.js
npm test -- packages/bruno-app/src/tests/plugins/trace/TraceResponse.spec.js

# Integration
npm test -- packages/bruno-app/src/tests/plugins/trace/integration/trace-flow.spec.js
```

### Watch Mode (Auto-rerun on changes)
```bash
npm test -- --watch packages/bruno-app/src/tests/plugins
```

### Coverage Report
```bash
npm test -- --coverage --coverageReporters=html packages/bruno-app/src/tests/plugins
# Open coverage/index.html in browser
```

## 📊 Test Suite Summary

| File | Tests | Coverage Target | Focus Area |
|------|-------|-----------------|------------|
| PluginRegistry.spec.js | 19+ | 95%+ | Plugin lifecycle |
| BFF_debug.spec.js | 28+ | 90%+ | Core functionality |
| TraceConfig.spec.js | 31+ | 90%+ | UI component |
| TraceResponse.spec.js | 29+ | 85%+ | Response display |
| trace-flow.spec.js | 26+ | 85%+ | Integration |
| **TOTAL** | **132+** | **90%+** | **All areas** |

## 🎯 What's Tested

### ✅ Plugin System (19+ tests)
- Registration/discovery
- Lifecycle management
- Validation
- Error handling

### ✅ Core Functionality (28+ tests)
- GET request interception
- Configuration inheritance
- URL manipulation
- Response routing

### ✅ UI Components (60+ tests)
- Form rendering
- User interactions
- Validation
- Accessibility

### ✅ Integration (26+ tests)
- End-to-end flow
- Network handling
- Concurrent requests
- Error scenarios

## 🔧 Pre-Test Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Project
```bash
npm run build
```

### 3. Verify Jest Config
```bash
cat packages/bruno-app/jest.config.js
```

## 📝 Test Status

**Current Status**: ✅ Test suite ready - awaiting implementation

**Next Steps**:
1. Wait for Coder to complete plugin implementation
2. Update test mocks with actual code
3. Run test suite
4. Verify 90%+ coverage
5. Document results

## 🐛 Troubleshooting

### Tests Not Running?
```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose packages/bruno-app/src/tests/plugins
```

### Mocks Not Working?
```bash
# Check mock imports
grep -r "jest.mock" packages/bruno-app/src/tests/plugins

# Reset modules in beforeEach
# Already included in all test files
```

### Coverage Not Showing?
```bash
# Generate detailed coverage
npm test -- --coverage --coverageReporters=json --coverageReporters=text packages/bruno-app/src/tests/plugins

# Check coverage thresholds in jest.config.js
```

## 📚 Documentation

- **Full Test Plan**: `/docs/TEST_PLAN_BFF_DEBUG_PLUGIN.md`
- **Test Suite Summary**: `/docs/TEST_SUITE_SUMMARY.md`
- **Test Patterns**: `/packages/bruno-app/src/tests/plugins/README.md`
- **This Guide**: `/packages/bruno-app/src/tests/plugins/QUICK_START.md`

## 🎓 Example: Running Your First Test

```bash
# 1. Navigate to project root
cd /home/marek/project/brunon/bruno

# 2. Run a simple test file
npm test -- packages/bruno-app/src/tests/plugins/PluginRegistry.spec.js

# 3. Check output for pass/fail
# Should see: "Tests: X passed, X total"

# 4. Run with coverage
npm test -- --coverage packages/bruno-app/src/tests/plugins/PluginRegistry.spec.js

# 5. View results
# Coverage summary displayed in terminal
```

## ⚙️ CI/CD Integration

Tests run automatically:
- ✅ Pre-commit hook
- ✅ Pull request checks
- ✅ Before production builds

## 📞 Support

**Issues?** Check swarm memory:
```bash
npx claude-flow@alpha hooks session-restore --session-id "swarm-1762301105186-67ld0cpm2"
```

**Questions?** Review documentation:
- Test Plan: Comprehensive testing strategy
- README: Detailed test patterns
- Summary: Quick overview

---

**Quick Start Version**: 1.0.0
**Last Updated**: 2025-11-05
**Test Suite**: BFF_debug trace plugin
**Total Tests**: 132+
**Status**: ✅ Ready
