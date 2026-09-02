import { chromium } from "playwright";

const user = { id: 7, openId: "audit-user", name: "Cristhian", email: "business.cir.pe@gmail.com", loginMethod: "manus", role: "user", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastSignedIn: new Date().toISOString() };
const slides = Array.from({ length: 6 }, (_, index) => ({ order: index + 1, eyebrow: ["Hook", "Contexto", "Idea central", "Desarrollo", "Aprendizaje", "CTA"][index], title: `Slide ${index + 1}`, body: "Texto breve para validar el editor 4:5.", visualHint: "Fondo limpio" }));
const trpc = (json) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { data: { json } } }) });

async function audit(viewport) {
  const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport });
  await page.route("**/api/trpc/**", async (route) => {
    const url = route.request().url();
    if (url.includes("auth.me")) return route.fulfill(trpc(user));
    if (url.includes("content.generate")) return route.fulfill(trpc({ title: "Carrusel auditado", hook: "Hook", body: "Caption", callToAction: "Guárdalo", hashtags: ["#producto"], structure: ["Hook", "CTA"], caption: "Caption editable", slides }));
    if (url.includes("content.listDrafts")) return route.fulfill(trpc([{ id: 21, userId: 7, title: "Carrusel guardado", idea: "Idea validada", channel: "instagram", format: "carousel", objective: "Compartir una idea", audience: "Builders", tone: "Claro", coreMessage: "Una idea", callToAction: "Guárdalo", content: "Caption editable", slides: JSON.stringify(slides), status: "draft", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]));
    return route.continue();
  });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.locator("textarea").first().fill("Una idea suficientemente larga para probar el carrusel.");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator("#core-message").fill("La IA ayuda a convertir una idea en una secuencia clara.");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: /Carrusel IG/ }).click();
  await page.getByRole("button", { name: "Crear borrador" }).click();
  await page.locator(".carousel-editor").waitFor();
  const editor = { step: await page.locator(".step-counter").textContent(), slides: await page.locator(".slide-strip button").count(), caption: await page.locator("#carousel-caption").isVisible(), cta: await page.getByRole("button", { name: "Guardar borrador" }).isVisible(), viewport };
  await page.goto("http://localhost:3000/?demo=library", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Borradores" }).click();
  await page.locator(".library-view").waitFor();
  const filter = page.getByRole("button", { name: "Carruseles IG" });
  await filter.click();
  const library = { filterActive: await filter.evaluate((element) => element.classList.contains("active")), draftVisible: await page.getByText("Carrusel guardado").isVisible() };
  await page.locator(".draft-main").filter({ hasText: "Carrusel guardado" }).click();
  await page.locator(".carousel-editor").waitFor();
  const reopened = { carouselReopened: await page.locator(".carousel-editor").isVisible(), reopenedSlides: await page.locator(".slide-strip button").count() };
  console.log(JSON.stringify({ editor, library, reopened }));
  await browser.close();
}

await audit({ width: 768, height: 1024 });
await audit({ width: 1280, height: 720 });
