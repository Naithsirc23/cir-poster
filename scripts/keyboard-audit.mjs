import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

const focused = [];
for (let index = 0; index < 18; index += 1) {
  await page.keyboard.press("Tab");
  focused.push(await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: (document.activeElement?.textContent || (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement ? document.activeElement.getAttribute("placeholder") : "")).trim().slice(0, 80), label: document.activeElement?.getAttribute("aria-label") })));
}

const input = page.locator("textarea").first();
await input.focus();
await input.fill("Una idea breve para validar el flujo de creación.");
const inputValue = await input.inputValue();
const continueButton = page.getByRole("button", { name: "Continuar" });
await continueButton.focus();
await page.keyboard.press("Enter");
const createAdvanced = await page.locator(".step-counter").textContent();
await page.keyboard.press("Shift+Tab");
const previousTag = await page.evaluate(() => document.activeElement?.tagName);
await page.keyboard.press("Tab");
const nextTag = await page.evaluate(() => document.activeElement?.tagName);

const draftsNav = page.getByRole("button", { name: "Borradores" });
await draftsNav.focus();
await page.keyboard.press("Enter");
const draftsVisible = await page.locator(".library-view").isVisible();
const allFilter = page.getByRole("button", { name: "Todos" });
const archivedFilter = page.getByRole("button", { name: "Archivados" });
await archivedFilter.focus();
await page.keyboard.press("Enter");
const archivedActive = await archivedFilter.evaluate((element) => element.classList.contains("active"));
await allFilter.focus();
await page.keyboard.press("Enter");
const allActive = await allFilter.evaluate((element) => element.classList.contains("active"));
await page.keyboard.press("Escape");
const afterEscape = await page.locator(".library-view").isVisible();

console.log(JSON.stringify({ focused, inputValue, createAdvanced, previousTag, nextTag, draftsVisible, archivedActive, allActive, afterEscape }, null, 2));
await browser.close();
