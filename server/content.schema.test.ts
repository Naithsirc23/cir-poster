import { describe, expect, it } from "vitest";
import { contentBriefSchema, postOutputParser } from "./routers";

const validBrief = {
  idea: "Quiero contar cómo construí un prototipo con IA.",
  channel: "linkedin" as const,
  format: "post" as const,
  objective: "Contar un aprendizaje",
  audience: "Personas que construyen productos digitales",
  tone: "Claro y reflexivo",
  coreMessage: "La IA acelera el prototipo, pero el criterio define la solución.",
  callToAction: "¿Qué aprendiste construyendo con IA?",
};

describe("content schemas", () => {
  it("accepts a complete editorial brief", () => {
    expect(contentBriefSchema.parse(validBrief)).toMatchObject(validBrief);
  });

  it("rejects an idea that is too short", () => {
    expect(() => contentBriefSchema.parse({ ...validBrief, idea: "corta" })).toThrow();
  });

  it("accepts a structured AI draft", () => {
    expect(postOutputParser.parse({
      title: "Construir con IA",
      hook: "La velocidad no reemplaza el criterio.",
      body: "Un cuerpo de post claro.",
      callToAction: "¿Qué opinas?",
      hashtags: ["#IA", "#Producto"],
      structure: ["Hook", "Idea", "CTA"],
    }).hashtags).toHaveLength(2);
  });
});


describe("instagram carousel schema", () => {
  it("accepts six editable slides", () => {
    const result = postOutputParser.parse({
      title: "Carrusel",
      hook: "Hook",
      body: "Caption",
      callToAction: "Guárdalo",
      hashtags: ["#producto"],
      structure: ["Hook", "Contexto"],
      caption: "Caption editable",
      slides: Array.from({ length: 6 }, (_, index) => ({ order: index + 1, title: `Slide ${index + 1}`, body: "Texto breve", visualHint: "Fondo limpio" })),
    });
    expect(result.slides).toHaveLength(6);
  });
});
