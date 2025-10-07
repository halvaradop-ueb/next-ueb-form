# Testing Integration Documentation

This document provides a comprehensive overview of the Playwright testing integration for the Next.js web application.

## 🎯 Overview

The testing suite provides comprehensive end-to-end testing for the teacher evaluation system, covering:

- **Authentication flows** for all user roles (admin, professor, student)
- **Dashboard functionality** with role-based access control
- **User management** (CRUD operations for professors and admins)
- **Subject management** (subjects and professor assignments)
- **Profile management** (user profile editing and photo uploads)
- **Integration workflows** (complete end-to-end scenarios)
- **Data persistence** verification
- **Error handling** and edge cases

## 🏗️ Architecture

### Test Structure

```
tests/
├── fixtures/                 # Test data files
├── pages/                   # Page Object Models
├── utils/                   # Test utilities and helpers
├── *.spec.ts               # Test files
├── global-setup.ts         # Global test setup
├── global-teardown.ts      # Global test cleanup
└── README.md              # Detailed test documentation
```

### Page Object Models

Each page has a dedicated Page Object Model class that encapsulates:

- Element selectors
- User interactions
- Validation methods
- Navigation helpers

### Test Utilities

- **Test Data**: Centralized test data for users, subjects, and scenarios
- **Auth Helpers**: Authentication and session management utilities
- **Page Helpers**: Common page interactions and validations
- **Database Helpers**: Data persistence verification utilities

## 🚀 Getting Started

### Prerequisites

1. Node.js 18+ installed
2. pnpm package manager
3. Development server running on localhost:3000

### Installation

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm test:install
```

### Running Tests

#### Quick Start

```bash
# Run all tests
pnpm test

# Run tests with UI mode (recommended for development)
pnpm test:ui

# Run tests in debug mode
pnpm test:debug
```

#### Advanced Usage

```bash
# Run specific test categories
pnpm test auth.spec.ts              # Authentication tests only
pnpm test dashboard.spec.ts         # Dashboard tests only
pnpm test users-management.spec.ts  # User management tests only
pnpm test subjects-management.spec.ts # Subject management tests only
pnpm test profile.spec.ts           # Profile tests only
pnpm test integration-workflow.spec.ts # Integration tests only

# Run tests with specific patterns
pnpm test --grep "admin"            # Tests containing "admin"
pnpm test --grep "login"            # Tests containing "login"

# Run tests in headed mode (visible browser)
pnpm test:headed

# Show test report
pnpm test:report
```

#### Using the Test Runner

```bash
# Run all tests with automatic setup
pnpm test:runner

# Run specific test types
pnpm test:runner auth
pnpm test:runner dashboard
pnpm test:runner ui
pnpm test:runner debug

# Show help
pnpm test:runner --help
```

## 🧪 Test Categories

### 1. Authentication Tests

- ✅ Login with valid credentials for all roles
- ✅ Invalid login attempts and error handling
- ✅ Session management and timeout
- ✅ Role-based access control
- ✅ Logout functionality
- ✅ Google OAuth integration

### 2. Dashboard Tests

- ✅ Dashboard content display
- ✅ Navigation sidebar functionality
- ✅ Role-based navigation items
- ✅ Responsive design testing
- ✅ Performance validation
- ✅ Logo and branding verification

### 3. User Management Tests

- ✅ Create new professors and admins
- ✅ Edit existing user information
- ✅ Delete users with confirmation
- ✅ Form validation and error handling
- ✅ Search functionality
- ✅ Photo upload functionality
- ✅ Data persistence verification

### 4. Subject Management Tests

- ✅ Create, edit, and delete subjects
- ✅ Create and delete professor assignments
- ✅ Form validation and duplicate prevention
- ✅ Search and filtering
- ✅ Data persistence verification
- ✅ Tab navigation between subjects and assignments

### 5. Profile Management Tests

- ✅ View profile information
- ✅ Edit personal information
- ✅ Upload and update profile photos
- ✅ Role-specific features (admin tabs)
- ✅ Data persistence verification
- ✅ Form validation

### 6. Integration Workflow Tests

- ✅ Complete admin workflow (login → create user → create subject → assign professor → update profile → logout)
- ✅ Professor workflow with limited access
- ✅ Student workflow with minimal access
- ✅ Cross-role data validation
- ✅ Data integrity testing
- ✅ Error recovery scenarios
- ✅ Session management

## 🔧 Configuration

### Playwright Configuration

The tests are configured in `playwright.config.ts` with:

- **Multiple browsers**: Chromium, Firefox, WebKit, Edge, Chrome
- **Mobile testing**: Pixel 5, iPhone 12
- **Parallel execution**: Faster test execution
- **Retry logic**: Failed tests retry on CI
- **Screenshots**: Captured on failure
- **Videos**: Recorded for failed tests
- **Traces**: Available for debugging

### Test Environment

- **Base URL**: http://localhost:3000
- **Test Data**: Centralized in `test-data.ts`
- **Global Setup**: Verifies application is running
- **Global Teardown**: Cleans up test environment

## 🎭 User Roles Testing

### Admin Role

- Full access to all features
- User management (create/edit/delete professors and admins)
- Subject management (create/edit/delete subjects and assignments)
- Profile management with admin-specific tabs
- Report generation capabilities

### Professor Role

- Limited access to evaluations
- Profile management (no admin tabs)
- Cannot access user management
- Cannot access subject management

### Student Role

- Minimal access to evaluations only
- Cannot access profile management
- Cannot access admin features

## 📊 Test Data Management

### Test Users

```typescript
const testUsers = {
  admin: {
    email: "admin@test.com",
    password: "admin123",
    // ... other properties
  },
  professor: {
    email: "professor@test.com",
    password: "professor123",
    // ... other properties
  },
  student: {
    email: "student@test.com",
    password: "student123",
    // ... other properties
  },
}
```

### Test Data

- Sample subjects with descriptions
- Professor information
- Evaluation data
- Expected navigation items per role

## 🔍 Data Persistence Testing

Tests verify data persistence by:

1. **Creating data** through the UI
2. **Verifying data appears** in the database
3. **Checking data consistency** across operations
4. **Validating CRUD operations** work correctly
5. **Testing search functionality** with persisted data

## 🚨 Error Handling

Tests cover various error scenarios:

- Network failures during API calls
- Server errors (500, 404, etc.)
- Form validation errors
- Access denied scenarios
- Session timeout and re-authentication
- Duplicate data prevention

## ⚡ Performance Testing

Tests include performance checks:

- Page load times (< 3 seconds)
- API response times (< 2 seconds)
- Search performance (< 1 second)
- Large dataset handling
- Memory usage optimization

## 🔄 CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Push to main/master/develop branches
- Pull requests
- Scheduled runs

### CI Configuration

- Ubuntu latest environment
- Node.js 18
- pnpm package manager
- Playwright browsers installation
- Test report generation
- Artifact upload for failed tests

## 🐛 Debugging

### Debug Mode

```bash
pnpm test:debug
```

Opens Playwright Inspector for step-by-step debugging.

### Trace Viewer

```bash
npx playwright show-trace trace.zip
```

Analyzes test execution traces.

### Screenshots and Videos

- Screenshots captured on test failure
- Videos recorded for failed tests
- Available in `test-results/` directory

### Console Logs

- Browser console logs captured
- Network requests logged
- Error messages preserved

## 📈 Test Reports

### HTML Report

```bash
pnpm test:report
```

Opens detailed HTML test report with:

- Test results summary
- Failed test details
- Screenshots and videos
- Execution timeline
- Performance metrics

### JSON Report

Test results exported to `test-results/results.json` for CI integration.

### JUnit Report

Test results exported to `test-results/results.xml` for CI systems.

## 🎯 Best Practices

### Test Design

1. **Use Page Object Models** for maintainable selectors
2. **Centralize test data** for consistency
3. **Test both success and failure scenarios**
4. **Include performance checks** where appropriate
5. **Verify data persistence** in database operations

### Maintenance

1. **Update selectors** when UI changes
2. **Keep test data current** with application changes
3. **Review and update** test scenarios regularly
4. **Monitor test execution time** and optimize as needed

### Debugging

1. **Use descriptive test names** and assertions
2. **Add meaningful error messages** to assertions
3. **Use proper waiting strategies** for dynamic content
4. **Capture screenshots** for visual debugging

## 🔧 Troubleshooting

### Common Issues

#### Tests Timeout

- Increase timeout in `playwright.config.ts`
- Check if development server is running
- Verify network connectivity

#### Element Not Found

- Update selectors in Page Object Models
- Check if elements are visible and interactable
- Use proper waiting strategies

#### Authentication Failures

- Verify test user credentials are correct
- Check if authentication service is running
- Ensure session management is working

#### Database Issues

- Verify database connection
- Check if test data is properly seeded
- Ensure database cleanup is working

### Debug Commands

```bash
# Check if application is running
curl http://localhost:3000

# Verify Playwright installation
npx playwright --version

# Run single test with debug info
npx playwright test auth.spec.ts --debug

# Check browser installation
npx playwright install --dry-run
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Test Configuration](https://playwright.dev/docs/test-configuration)
- [CI/CD Integration](https://playwright.dev/docs/ci)
- [Debugging Guide](https://playwright.dev/docs/debug)

## 🤝 Contributing

When adding new tests:

1. Follow existing naming conventions
2. Use Page Object Models for new pages
3. Add test data to centralized files
4. Include both positive and negative test cases
5. Add performance checks where appropriate
6. Update documentation as needed

## 📞 Support

For testing-related issues:

1. Check the troubleshooting section
2. Review test logs and screenshots
3. Use debug mode for detailed investigation
4. Consult Playwright documentation
5. Check GitHub issues for known problems
