import { test, expect } from '../../playwright';

test.describe('OpenAPI Documentation', () => {
  test('should show OpenAPI indicator in Overview', async ({ pageWithUserData: page }) => {
    // Wait for app to load
    await page.locator('[data-app-state="loaded"]').waitFor();

    // Find and click on the test collection
    const collection = page.locator('#sidebar-collection-name').filter({ hasText: 'Test OpenAPI Collection' });
    await expect(collection).toBeVisible();
    await collection.click();

    // Accept sandbox modal if it appears
    const sandboxModal = page.locator('.bruno-modal-header-title', { hasText: 'JavaScript Sandbox' });
    if (await sandboxModal.isVisible()) {
      await page.getByLabel('Safe Mode').check();
      await page.getByRole('button', { name: 'Save' }).click();
    }

    // Click on collection actions (three dots) to open settings
    await page.locator('.collection-actions').first().click();
    await page.locator('.dropdown-item').filter({ hasText: 'Settings' }).click();

    // Wait for settings to open
    await expect(page.locator('.tab.overview')).toBeVisible();

    // Should see OpenAPI indicator in Overview - use more specific selector
    await expect(page.locator('.font-semibold.text-sm').filter({ hasText: 'OpenAPI' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=View API Documentation')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to API Doc tab when clicking OpenAPI indicator', async ({ pageWithUserData: page }) => {
    // Wait for app to load
    await page.locator('[data-app-state="loaded"]').waitFor();

    // Find and click on the test collection
    const collection = page.locator('#sidebar-collection-name').filter({ hasText: 'Test OpenAPI Collection' });
    await collection.click();

    // Accept sandbox modal if it appears
    const sandboxModal = page.locator('.bruno-modal-header-title', { hasText: 'JavaScript Sandbox' });
    if (await sandboxModal.isVisible()) {
      await page.getByLabel('Safe Mode').check();
      await page.getByRole('button', { name: 'Save' }).click();
    }

    // Open collection settings
    await page.locator('.collection-actions').first().click();
    await page.locator('.dropdown-item').filter({ hasText: 'Settings' }).click();

    // Click on the OpenAPI indicator
    await page.locator('text=View API Documentation').click();

    // Should navigate to API Doc tab
    await expect(page.locator('.tab.apidoc.active')).toBeVisible({ timeout: 5000 });
  });

  test('should render custom OpenAPI viewer', async ({ pageWithUserData: page }) => {
    // Track console errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for app to load
    await page.locator('[data-app-state="loaded"]').waitFor();

    // Find and click on the test collection
    const collection = page.locator('#sidebar-collection-name').filter({ hasText: 'Test OpenAPI Collection' });
    await collection.click();

    // Accept sandbox modal if it appears
    const sandboxModal = page.locator('.bruno-modal-header-title', { hasText: 'JavaScript Sandbox' });
    if (await sandboxModal.isVisible()) {
      await page.getByLabel('Safe Mode').check();
      await page.getByRole('button', { name: 'Save' }).click();
    }

    // Open collection settings
    await page.locator('.collection-actions').first().click();
    await page.locator('.dropdown-item').filter({ hasText: 'Settings' }).click();

    // Click on API Doc tab
    await page.locator('.tab.apidoc').click();

    // Wait for custom viewer to load
    await page.waitForTimeout(2000);

    // Check for custom viewer elements
    await expect(page.locator('.openapi-explorer')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.openapi-sidebar')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.openapi-content')).toBeVisible({ timeout: 5000 });

    // Check for API title in sidebar header
    await expect(page.locator('.openapi-sidebar-header h2')).toContainText('Test OpenAPI Collection');

    // Check that no critical errors occurred
    const criticalErrors = consoleErrors.filter((err) =>
      !err.includes('ExtensionLoadWarning')
      && !err.includes('GetVSyncParametersIfAvailable'));

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('should show API Doc tab for collection with openapi.yaml', async ({ pageWithUserData: page }) => {
    // Wait for app to load
    await page.locator('[data-app-state="loaded"]').waitFor();

    // Find and click on the test collection
    const collection = page.locator('#sidebar-collection-name').filter({ hasText: 'Test OpenAPI Collection' });
    await collection.click();

    // Accept sandbox modal if it appears
    const sandboxModal = page.locator('.bruno-modal-header-title', { hasText: 'JavaScript Sandbox' });
    if (await sandboxModal.isVisible()) {
      await page.getByLabel('Safe Mode').check();
      await page.getByRole('button', { name: 'Save' }).click();
    }

    // Open collection settings
    await page.locator('.collection-actions').first().click();
    await page.locator('.dropdown-item').filter({ hasText: 'Settings' }).click();

    // The API Doc tab should be visible
    await expect(page.locator('.tab.apidoc')).toBeVisible({ timeout: 5000 });
  });
});
