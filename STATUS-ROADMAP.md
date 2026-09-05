# CIR Post Studio — estado y roadmap

**Última actualización:** 2026-09-02  
**Repositorio:** [Naithsirc23/cir-poster](https://github.com/Naithsirc23/cir-poster)  
**Checkpoint de referencia:** `c24186b8`

## Estado actual

CIR Post Studio es una PWA mobile-first para transformar una idea rápida en un borrador de contenido. El flujo principal ya permite definir idea, objetivo, audiencia, tono, mensaje central, canal y formato antes de generar un resultado editable.

La primera experiencia completa es LinkedIn. También está implementado el flujo de **Instagram Carrusel**, con seis slides estructuradas, preview 4:5, caption editable, navegación, duplicación y eliminación de slides, guardado y reapertura desde la biblioteca.

| Área | Estado |
|---|---|
| Experiencia mobile-first | Implementada |
| Navegación inferior | Implementada |
| Diseño premium | Implementado: dark editorial-tech, transparencias y acento lima |
| IA | Generación estructurada desde servidor, con límite de salida para carruseles |
| LinkedIn | Flujo completo |
| Instagram Carrusel | MVP funcional |
| Facebook | Preparado, pendiente de plantilla específica |
| TikTok | Preparado, pendiente de plantilla de guion |
| Biblioteca | Guardar, retomar, duplicar, archivar y filtrar |
| Persistencia | Drizzle/MySQL por usuario |
| PWA | `manifest.json` y service worker incluidos |
| Tests | 11 tests Vitest pasando |
| Validación | Type-check, build, móvil, tablet, desktop y auditoría de teclado |

## Avances recientes

Se añadió el modelo persistente de slides sin romper los borradores anteriores. La generación de carruseles devuelve una estructura controlada con hook, slides, caption y CTA. El editor usa un marco 4:5, mantiene una slide activa y permite revisar la secuencia antes de guardar.

La biblioteca incorpora un filtro específico para **Carruseles IG**. También se añadió un modo local de auditoría (`?demo=carousel` y `?demo=library`) para validar la interfaz sin consumir IA ni requerir autenticación. El script `scripts/carousel-flow-audit.mjs` comprueba el flujo real hasta el paso 04/04, la biblioteca, el filtro y la reapertura en tablet y desktop.

## Pendientes

El siguiente bloque de trabajo debe centrarse en exportar los slides como PNG/JPG, mejorar la personalización visual de cada carrusel y añadir plantillas específicas para Facebook y TikTok. La publicación automática en redes no forma parte todavía del MVP.

También queda pendiente definir un sistema más completo de historial de versiones, plantillas reutilizables, edición de colores/tipografías por marca y una estrategia de almacenamiento de imágenes generadas. Para publicar en redes será necesario configurar las APIs y permisos de cada plataforma por separado.

## Obstáculos y decisiones

La autenticación protege la biblioteca y las operaciones persistentes. Por eso, las pruebas visuales locales usan datos simulados y no alteran la base real. La IA se invoca en el servidor para no exponer credenciales ni contratos internos al navegador.

El proyecto se mantiene en el stack proporcionado por CIR Post Studio: React, Vite, Express, tRPC, Drizzle/MySQL y Manus OAuth. El desarrollo local es el camino más directo si se desea usar el filesystem propio y exponer el servicio dentro de una red Tailscale. Tailscale Serve publica un servicio local dentro de la tailnet; Tailscale Funnel sería necesario únicamente si se quiere abrirlo a Internet, por lo que no debe activarse por defecto.[1] [2]

## Ejecución desde filesystem

Después de clonar el repositorio:

```bash
git clone https://github.com/Naithsirc23/cir-poster.git
cd cir-poster
pnpm install
cp .env.example .env  # si se incorpora ese archivo en una futura iteración
pnpm dev
```

Para una ejecución de producción local:

```bash
pnpm install
pnpm build
NODE_ENV=production pnpm start
```

La aplicación usa las variables de entorno del proyecto para autenticación, base de datos y generación. No se deben añadir secretos al repositorio ni a archivos versionados.

## Exposición como PWA mediante Tailscale

En la máquina donde corre CIR Post Studio, instalar y autenticar Tailscale. Con la aplicación ejecutándose en `127.0.0.1:3000`, publicar el servicio únicamente dentro de la tailnet:

```bash
tailscale serve --bg http://127.0.0.1:3000
tailscale serve status
```

Tailscale mostrará una URL HTTPS asociada al dispositivo. Esa URL es adecuada para probar la PWA desde otro dispositivo conectado a la misma tailnet. El HTTPS es importante para que el navegador acepte correctamente las capacidades instalables de una PWA fuera de `localhost`.

Para detener la exposición:

```bash
tailscale serve reset
```

No usar `tailscale funnel` salvo que se haya decidido exponer la aplicación públicamente. Si se necesita acceso público, primero habría que añadir autenticación robusta, limitar el acceso a la biblioteca y revisar las políticas de CORS, cookies y OAuth.

## Roadmap recomendado

| Fase | Entregable | Prioridad |
|---|---|---:|
| 1 | Exportación PNG/JPG de cada slide y descarga ZIP | Alta |
| 2 | Sistema de identidad visual: colores, tipografías, logo y presets | Alta |
| 3 | Historial de versiones y recuperación de borradores | Media |
| 4 | Plantillas de Facebook y guiones de TikTok | Media |
| 5 | Integraciones oficiales de publicación | Posterior |
| 6 | Analítica editorial: temas, formatos y rendimiento | Posterior |

## Comandos de mantenimiento

```bash
pnpm check
pnpm test
pnpm build
node scripts/carousel-flow-audit.mjs
git status --short
git pull --ff-only origin main
```

## Referencias

[1]: https://tailscale.com/kb/1242/tailscale-serve — Tailscale Serve: publicación de servicios dentro de la tailnet.

[2]: https://tailscale.com/kb/1223/funnel — Tailscale Funnel: exposición de servicios a Internet público.
