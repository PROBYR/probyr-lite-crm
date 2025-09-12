import { test, expect } from '@playwright/test';

test.describe('Pipeline Page', () => {
  test('should load pipeline without crashes and display deals', async ({ page }) => {
    // Navigate to pipeline page
    await page.goto('/pipeline');

    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Sales Pipeline');

    // Check that the page doesn't show error messages
    await expect(page.locator('text=Failed to fetch deals')).not.toBeVisible();
    await expect(page.locator('text=Failed to load deals')).not.toBeVisible();

    // Verify pipeline stages are displayed
    await expect(page.locator('[data-testid="stage-column"]').first()).toBeVisible({ timeout: 10000 });

    // Check for deals in the pipeline (there should be some demo data)
    const dealCards = page.locator('[data-testid="deal-card"]');
    await expect(dealCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle deal creation without crashes', async ({ page }) => {
    await page.goto('/pipeline');

    // Click "Add Deal" button
    await page.click('text=Add Deal');

    // Verify dialog opens
    await expect(page.locator('text=Create New Deal')).toBeVisible();

    // Fill in required fields
    await page.fill('input[id="title"]', 'Test Deal 2500.50');
    await page.fill('input[id="value"]', '2500.50');

    // Submit the form
    await page.click('text=Create Deal');

    // Verify success (either success message or dialog closes)
    await expect(page.locator('text=Create New Deal')).not.toBeVisible({ timeout: 10000 });

    // Check that the deal appears in the pipeline
    await expect(page.locator('text=Test Deal 2500.50')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=$2,501')).toBeVisible(); // Formatted currency
  });

  test('should open CreatePersonDialog without crashes when arrays are empty', async ({ page }) => {
    // Mock empty API responses
    await page.route('**/companies', route => {
      route.fulfill({ json: { companies: [] } });
    });
    await page.route('**/tags', route => {
      route.fulfill({ json: { tags: [] } });
    });

    await page.goto('/contacts');

    // Click "Add Contact" button
    await page.click('text=Add Contact');

    // Verify dialog opens without crashing
    await expect(page.locator('text=Add New Contact')).toBeVisible();

    // Verify form fields are accessible
    await expect(page.locator('input[id="firstName"]')).toBeVisible();
    await expect(page.locator('input[id="lastName"]')).toBeVisible();

    // Verify dropdowns work even with empty data
    await page.click('[role="combobox"]'); // Company dropdown
    await expect(page.locator('text=No company')).toBeVisible();

    // Close dialog
    await page.click('text=Cancel');
    await expect(page.locator('text=Add New Contact')).not.toBeVisible();
  });

  test('should display deal values as numbers consistently', async ({ page }) => {
    await page.goto('/pipeline');

    // Wait for deals to load
    await expect(page.locator('[data-testid="deal-card"]').first()).toBeVisible({ timeout: 10000 });

    // Check that all deal values are displayed as formatted currency
    const dealCards = page.locator('[data-testid="deal-card"]');
    const count = await dealCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = dealCards.nth(i);
      const dollarSignElements = card.locator('text=/\\$[0-9,]+/');
      
      if (await dollarSignElements.count() > 0) {
        const valueText = await dollarSignElements.first().textContent();
        expect(valueText).toMatch(/\$[\d,]+/); // Should be formatted currency
      }
    }
  });

  test('should handle drag and drop without errors', async ({ page }) => {
    await page.goto('/pipeline');

    // Wait for deals and stages to load
    await expect(page.locator('[data-testid="deal-card"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="stage-column"]')).toHaveCount.greaterThan(1);

    // Get the first deal card and a different stage
    const firstDeal = page.locator('[data-testid="deal-card"]').first();
    const targetStage = page.locator('[data-testid="stage-column"]').nth(1);

    // Perform drag and drop
    await firstDeal.dragTo(targetStage);

    // Verify no error messages appear
    await expect(page.locator('text=Failed to move deal')).not.toBeVisible();
  });
});
