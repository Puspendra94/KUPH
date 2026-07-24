import { test, expect } from '@playwright/test';

test.describe('KUPH End-to-End Feature Verification', () => {
  const timestamp = Date.now();
  const testEmail = `e2e_user_${timestamp}@example.com`;
  const testPassword = 'Password123!';
  const testName = `E2E Test User ${timestamp}`;

  test('1. Full Flow: Register, Login, Dashboard, CRM, Campaigns, Settings & Logout', async ({ page }) => {
    // --- Step A: Registration ---
    console.log('Navigating to register page...');
    await page.goto('http://localhost:8083/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    console.log(`Registering new user: ${testEmail}`);
    await page.fill('#reg-name', testName);
    await page.fill('#reg-email', testEmail);
    await page.fill('#reg-password', testPassword);
    await page.fill('#reg-confirm-password', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to /dashboard on successful registration & login
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*dashboard/);
    console.log('Successfully registered and redirected to Dashboard.');

    // --- Step B: Dashboard Verification ---
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByRole('main').getByText('Active Campaigns')).toBeVisible();
    await expect(page.getByRole('main').getByText('Influencers')).toBeVisible();
    await expect(page.getByRole('main').getByText('Clients')).toBeVisible();

    // --- Step C: Influencers CRM Page ---
    console.log('Navigating to Influencers page...');
    await page.goto('http://localhost:8083/influencers');
    await expect(page.getByRole('heading', { name: 'Influencers', exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Search by name or niche...')).toBeVisible();
    await expect(page.getByRole('main').getByText('Import')).toBeVisible();
    await expect(page.getByRole('main').getByText('Add Influencer')).toBeVisible();

    // Test Add Influencer Modal
    await page.click('button:has-text("Add Influencer")');
    await page.fill('#add-name', `Influencer ${timestamp}`);
    await page.fill('#add-niche', 'Tech & AI');
    await page.fill('#add-followers', '75000');
    await page.fill('#add-engagement', '4.2%');
    await page.click('button[type="submit"]:has-text("Add Influencer")');

    // Verify added influencer appears
    await expect(page.getByText(`Influencer ${timestamp}`)).toBeVisible({ timeout: 10000 });
    console.log('Successfully added and verified new Influencer in CRM.');

    // --- Step D: Clients CRM Page ---
    console.log('Navigating to Clients page...');
    await page.goto('http://localhost:8083/clients');
    await expect(page.getByRole('heading', { name: 'Clients', exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Search by name or industry...')).toBeVisible();

    // --- Step E: Campaigns Page & Details ---
    console.log('Navigating to Campaigns page...');
    await page.goto('http://localhost:8083/campaigns');
    await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible();

    // Click first campaign if present
    const firstCampaign = page.locator('.group').first();
    if (await firstCampaign.isVisible()) {
      await firstCampaign.click();
      await page.waitForURL('**/campaigns/*', { timeout: 5000 });
      console.log('Successfully loaded Campaign Details view.');
    }

    // --- Step F: Settings Page ---
    console.log('Navigating to Settings page...');
    await page.goto('http://localhost:8083/settings');
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Team' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Billing' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Activity' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Danger' })).toBeVisible();

    // Click through settings tabs
    await page.click('button:has-text("Team")');
    await expect(page.getByText('Team Members')).toBeVisible();

    await page.click('button:has-text("Billing")');
    await expect(page.getByRole('heading', { name: 'Current Plan' })).toBeVisible();

    // --- Step G: Logout & Login Test ---
    console.log('Testing logout and re-login flow...');
    await page.click('button:has-text("Danger")');
    await page.click('button:has-text("Logout")');

    // Should redirect to /login
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
    console.log('Successfully logged out.');

    // Re-login with test account
    console.log(`Re-logging in with email: ${testEmail}`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL(/.*dashboard/);
    console.log('Re-login successful!');
  });
});
