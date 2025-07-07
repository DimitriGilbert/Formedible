import puppeteer, { Browser, Page } from 'puppeteer';
import { DevServerManager } from './utils/dev-server';

declare global {
  var browser: Browser;
  var page: Page;
  var devServer: DevServerManager;
}

beforeAll(async () => {
  // Start dev server if needed
  global.devServer = new DevServerManager();
  await global.devServer.start();

  global.browser = await puppeteer.launch({
    headless: false,  // Keep debug view
  });
}, 60000); // 60 second timeout for server startup

beforeEach(async () => {
  global.page = await global.browser.newPage();
  await global.page.setViewport({ width: 1280, height: 720 });
});

afterEach(async () => {
  if (global.page) {
    await global.page.close();
  }
});

afterAll(async () => {
  if (global.browser) {
    await global.browser.close();
  }
  
  // Stop dev server if we started it
  if (global.devServer) {
    await global.devServer.stop();
  }
});