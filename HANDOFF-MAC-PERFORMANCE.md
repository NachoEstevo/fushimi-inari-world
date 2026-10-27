# Fushimi Inari — continuar performance en Mac

Estado al **26 de octubre de 2026**. El usuario pidió interrumpir la investigación local y llevarla a otro chat en Mac. **Todavía NO está validada una experiencia sin tirones.** Este documento viaja con los últimos cambios de `main`; usar el commit que lo contiene, no volver a partir de la versión anterior del diagnóstico.

## Objetivo y restricciones

Preparar los lotes antes de que entren en pantalla, sobre todo al girar, manteniendo geometría, materiales, texturas, reflejos, iluminación y calidad cercana. Los FPS altos no son suficiente: el síntoma son pausas al caminar o mirar hacia otra zona. El usuario confirmó que ocurren principalmente al caminar/girar.

Continuar hasta una experiencia fluida, con mediciones comparables. No declarar victoria por tests ni por FPS medios. Preservar trabajo de otros chats, especialmente `showcase-capture.mjs`, inscripciones de torii, migración WebGPU y captura de video. No publicar capturas/archivos históricos masivos de `outputs/` o documentos locales antiguos.

## Punto de partida y cambios anteriores que ya están en GitHub

Repositorio: `https://github.com/NachoEstevo/fushimi-inari-world`, rama `main`.

- `1bce53e`: librito de cinco sellos con persistencia local, correcciones de navegación/interacciones, diagnóstico de tirones y contexto del sendero Yakuriki. Incluyó el módulo de captura del otro chat para mantener sus imports completos.
- `802d92f`: diagnóstico optativo de construcción de materiales y modo de recorrido con precalentamiento activo. Es la referencia **antes** de las mejoras de este handoff.
- Las cajas marrones/naranjas investigadas en Yakuriki eran extrusiones genéricas de edificios con forma/altura no documentada; no eran texturas que no descargaban. Se corrigieron los IDs concretos en `yakuriki-trail-context.mjs`, sin retirar la información/POIs del mapa. No volver a tratarlas todas como un problema de descarga.
- `public-walk-domain.mjs`: rechazo temprano de consultas de soporte de grava muy alejadas de la entrada, antes de recorrer polígonos. La equivalencia de admisión ya se comprobó. Era gasto CPU real durante caminatas en la montaña.
- `scoped-compilation.mjs`: la preparación puede reutilizar **la escena y cámara reales** (`reuseRenderScene`). Se restaura jerarquía/visibilidad/estado de sombras antes de esperar al backend. No volver a escenas/cámaras clonadas para esa preparación: r180 usa esas identidades en sus cachés.
- `render-quality-nodes.mjs`: matrices del mundo se actualizan una vez antes del postproceso y se evita repetir la recomposición en pasadas anidadas. No revertir sin evidencia.

## Hallazgo confirmado: construcción de shaders en CPU al aparecer lotes

Three está fijado a **r180 / 0.180.0** en el import map del navegador. El visor realmente usaba WebGPU. Los nombres históricos como `render-quality.mjs` se redirigen a versiones Node/WebGPU; su presencia no demuestra que haya dos renderers ejecutándose.

En una captura de CPU de 32,48 s, las muestras bajo `getNodeBuilderState` acumularon unos **6.587 ms en render visible**, 30 ms bajo sombras y 20 ms bajo `compileAsync`. Son tiempos inclusivos estimados de CPU acumulados durante el perfil, **no tiempo de un frame ni compilación GPU medida**. En una repetición caliente, el render visible bajó a unos 310 ms.

El observador directo llegó a registrar 416 construcciones y 7.774,5 ms acumulados. Muchos casos eran lotes distintos con el mismo material físico de torii. En r180:

- `src/renderers/common/RenderObject.js` agrega `object.uuid` a la clave de cada `InstancedMesh`.
- `Nodes.getForRender` usa esa clave para su estado del builder.
- `InstanceNode` enlaza los buffers de ese objeto; usa UBO o atributos según la capacidad `instanceMatrix.count`.

**No quitar el UUID ni compartir estados a ciegas:** hay que resolver correctamente los buffers y matrices por instancia. Preparar un torii no prepara automáticamente los demás, aunque compartan material.

## Mejoras implementadas ahora

### Activadas en el flujo normal

1. **Cola de `walking-prewarm.mjs`:**
   - Repone tandas agotadas mientras quedan candidatos, incluso estando quieto.
   - Detecta cambios importantes de dirección, además de desplazamiento.
   - Cubre posición actual y posición anticipada; no deja toda la zona detrás sin preparar.
   - Prioriza por distancia a la esfera y, ante empate, por distancia a su centro. Evita que esferas muy grandes monopolicen la cola.
   - `setRadius()` cambia cobertura sin borrar el trabajo ya preparado.
   - La reposición de backlog tiene reloj separado (`refillIntervalMs`); el viewer usa 100 ms. Movimiento/giro conservan su cadencia de 1.500 ms y umbral de 6 m.
   - Máximo ocho pendientes y **un solo trabajador**. Pausa, cancelación, invalidación de calidad y `awaitIdle` se preservan.
   - Los fallos no se reintentan en un bucle continuo de refill.
   - `markRendered()` evita gastar turnos en raíces registradas que ya se dibujaron en esta generación.

2. **Cobertura real en `viewer.mjs` / `integration.mjs`:**
   - Pasa dirección real de la cámara, con vector reutilizado.
   - Cobertura usa las esquinas de la vista (`prewarmViewRadius(camera) + 24`), limitada a 300 m; se actualiza con calidad y resize. El `far` es profundidad axial, no distancia radial: usar simplemente 150 m dejaba esquinas afuera.
   - Se registran los lotes de torii de Senbon, legacy particionados y montaña con límites individuales en coordenadas del mundo.
   - Se toman también las instancias de detalles/velas creadas después de la integración. No duplicar entradas cuyos ancestros ya son propietarios de preparación.
   - Para una entrada LOD se preparan sus niveles como raíces explícitas, incluidos los dormidos; no se altera su visibilidad ni el nivel mostrado.

3. **`prewarm-render-observer.mjs`:**
   - Usa `onAfterRender` preservando el callback original.
   - Solo marca draws reales de la cámara principal dentro de `renderWalkingFrame`; excluye callbacks de `compileAsync` y cámaras de sombras.
   - Un leaf mostrado no marca como preparado su propietario LOD entero.
   - Excluye materiales múltiples y no marca si el callback cambia material/versión.
   - Limpieza respeta BFCache (`pagehide` con `persisted` no desinstala una aplicación que vuelve).

### Experimentos implementados, **desactivados por defecto**

- **`prewarmHeadroom=1` — `prewarm-frame-budget.mjs`:** mientras la cámara está quieta y hay preparación activa, limita los draws a un máximo de 60 FPS para liberar CPU. Movimiento/mirada reanudan inmediatamente el render sin ese límite. No cambia la calidad de imagen. En una exploración permitió preparar 441 propietarios en una espera nominal donde antes se preparaban decenas. No asumir una victoria global: ver comparación controlada abajo.
- **`prewarmCull=1` — `static-color-cull.mjs`:** rechaza, antes de construir shaders, algunas falsas admisiones del test esfera/planos que están completamente fuera de una esfera que encierra todo el frustum. Solo cámara principal y propietarios estáticos comprobados. Sombras/reflejos no se filtran. No toca geometría ni distancia de clipping.
  - Se excluyen interactuables animados retenidos, skinned/morph, transformaciones con shear significativo, callbacks `onBeforeRender` propios y desplazamiento/posición de shader personalizados.
  - Solo recibe hojas de `staticBatches.meshes`, torii estáticos explícitos y bosque estático. **La lista ampliada de prewarm NO autoriza culling estático.**
  - Los límites son snapshots: si se mueve un objeto/ancestro o cambian matrices de instancias, hay que excluirlo o recalcularlos.
  - El radio se actualiza en cada `quality.render`, también en foto. Las pruebas comprueban el rechazo conservador y que la cámara de sombra conserva el draw.
  - Revisión independiente Terra 6.1 no encontró otra regresión estática tras restringir ownership; falta aceptación visual amplia, foto, resize y GPU/Mac antes de habilitar por defecto.

Los materiales y la geometría originales siguen intactos. **No hay un fallback de materiales por niebla implementado.** No confundir ideas discutidas con código existente.

## Pruebas ya realizadas: no repetirlas como si fueran hipótesis nuevas

- Subdivisión general de lotes visibles: aproximadamente 153,6 → 153,2 FPS en la comparación caliente; no ganó. Se retiró ese prototipo.
- Proxies amplios solo de sombra: aumentaron objetos/draws y empeoraron el rendimiento. La subdivisión selectiva quedó experimental, apagada en la experiencia normal.
- En una vista fija, sombra selectiva pasó de 458.845 a 449.437 triángulos (2,05% menos), pero de 147 a 149 dibujos. No justifica por sí sola habilitarla.
- Las sombras ya tienen atlas 2048 y actualización programada; la copa distante ya no proyecta sombras. No quitar sombras lejanas arbitrariamente: con sol bajo pueden entrar en el área visible.
- Preparar siete vistas antes del recorrido redujo pausas largas pero dejó estados por construir. Esto traslada trabajo, no demuestra que el flujo normal sea fluido.
- Ampliar cobertura/cola por sí solo no bastó. El cruce de UUIDs no encontró reconstrucciones de los mismos objetos ya preparados; los caros todavía no habían sido preparados.
- Dos trabajadores de prewarm se probaron: no mejoraron, hubo una peor pausa de unos 2,65 s aunque sin errores GPU. **La concurrencia experimental se retiró**; no hay opción `maxConcurrent` para activar ahora.
- API de entrada de teclado por CDP crudo no estaba habilitada en este entorno. Se usó la ruta de cámara automática; no presentar eso como QA WASD completa.

## Mediciones portables

Resumen pequeño versionado: `docs/performance/prewarm-comparison-2026-10-26.json`.

Windows / Codex IAB / WebGPU, viewport CSS 1280×720, ratio 1,5, High + Sakura, atlas 2048. Ruta automática de Mitsurugi: 12 m de ida y vuelta, 16 s, giro de retorno. Una vista inicial y anticipación controlada desde el mismo script; sin las siete vistas de calentamiento ni vuelta previa. Poses verificadas idénticas.

| Métrica | Antes (`802d92f`) | Último después observado |
| --- | ---: | ---: |
| Anticipación real | 10.321 ms | 10.340 ms |
| FPS medios | 61,16 | 62,79 |
| p95 de intervalo | 30,21 ms | 18,30 ms |
| p99 de intervalo | 93,56 ms | 121,30 ms |
| Peor pausa | 2.181,8 ms | 1.442,5 ms |
| Construcciones observadas | 268 | 175: 19 precompile + 156 render |

El después incluye los flags experimentales headroom/cull. **El p99 empeoró; no hay victoria global de fluidez validada.** No extrapolar este resultado al modo normal sin esos flags. Hay variación de actores/cachés y overhead del observador. El tiempo de envío CPU no mide tiempo GPU.

Exploraciones con más espera llegaron a peor pausa de 321 ms y p99 36,4 ms; sus esperas no quedaron controladas de la misma forma. No compararlas directamente con la fila de referencia ni publicarlas como la mejora final.

La última lista ampliada tiene unas 3.035 entradas frente a 2.424 anteriores. El último después todavía tuvo trabajo en cola al iniciar/mientras recorría la zona. La próxima investigación debe localizar las entradas que siguen llegando tarde y por qué, usando identidades/fases; no volver a elegir optimizaciones solo por contar triángulos.

## Instrumentación y reproducción

Servidor desde la raíz del repo:

```sh
python3 -m http.server 8420 --directory fushimi_inari
```

Abrir:

```text
http://127.0.0.1:8420/integrated-world/index.html?audit=1&intro=0&shadowAudit=1&shadowCells=legacy&shadowFreeze=0&shadowFlow=live&pipelineAudit=1&prewarmHeadroom=1&prewarmCull=1
```

**Importante:** `shadowFlow=live` mantiene prewarm/streaming y omite el precalentamiento previo del banco; sin ese flag, el banco histórico bloquea walkingPrewarm. Mantener `shadowCells=legacy&shadowFreeze=0` para no mezclar la partición de sombras experimental. No agregar `shadowWarmup=1` a una primera exposición: ese flag prepara siete vistas antes de medir.

1. Usar un solo renderer 3D por vez. Igualar calidad, look, luz, viewport y ratio.
2. Esperar a que termine el cambio de calidad (`walkingPrewarm.generation >= 1`, no bloqueado).
3. `Preview start`; dar una espera controlada; `Run shadow route` en el mismo script para evitar tiempo variable entre mensajes.
4. Guardar JSON de los datasets. Repetir en caliente y después **sin `pipelineAudit=1`**, para medir sin ese observador.
5. Falta una aproximación caminando de forma continua y giros graduales en Mac. El banco teletransporta a la zona y no reproduce exactamente la entrada progresiva del usuario.

Datasets útiles:

- `shadowRouteAudit`: intervalos, p95/p99/peor frame, poses y muestras lentas con `elapsedMs`.
- `renderBuildAuditAtEnd`: snapshot exacto al finalizar; cuenta/tiempo por fase, UUID, material, cámara, si estaba registrado/preparado, límites y distancia.
- `walkingPrewarmAtEnd`: cola/cancelaciones/compilados/dibujados al finalizar.
- `prewarmColorCull`, `walkingPrewarmError`, `gpuError`, `rendererBackend`, `renderQuality`.

`slowFrames.gap` mide entre RAF; su `submitMs` es del frame actual. No atribuir automáticamente la pausa a la bandera de sombras del mismo registro: puede corresponder al trabajo del frame anterior.

## Tests y entorno Mac

El navegador carga Three r180 por CDN; `node_modules` y `.tmp` no viajan con Git. El entorno Windows tenía Three 0.164.1 para tests heredados. Varios tests WebGPU necesitan otro runtime: mezclar todos bajo una sola versión produce fallos de entorno/mocks, no necesariamente regresiones.

Validación al entregar: **1.096 tests generales pasaron, 21 omitidos; 63 tests bajo r180 pasaron** (hay pruebas enfocadas repetidas entre ambos grupos). Sintaxis, diff y build estático comprobados. Node usado: v22.13.0. Build: 561 archivos runtime, aproximadamente 69,90 MB.

Para recrear el runtime WebGPU de pruebas:

```sh
npm install --prefix .tmp/webgpu-runtime --no-save --package-lock=false three@0.180.0
node --experimental-loader ./scripts/webgpu-test-loader.mjs --test \
  fushimi_inari/integrated-world/walking-prewarm.test.mjs \
  fushimi_inari/integrated-world/scoped-compilation.test.mjs \
  fushimi_inari/integrated-world/render-build-audit.test.mjs \
  fushimi_inari/integrated-world/instance-prewarm-entries.test.mjs \
  fushimi_inari/integrated-world/prewarm-render-observer.test.mjs \
  fushimi_inari/integrated-world/prewarm-frame-budget.test.mjs \
  fushimi_inari/integrated-world/static-color-cull.test.mjs
node scripts/build-static.mjs
```

El loader portable se entrega en `scripts/webgpu-test-loader.mjs`. Si se necesitan los tests heredados, instalar Three 0.164.1 en el `node_modules` local ignorado, sin cambiar dependencias del producto. Los nueve tests que necesitan el runtime r180 son `cloud-shade`, `keihan-street-ground-nodes`, `leaf-light-study`, `precinct-leaf-light`, `render-quality-nodes`, `sky-nodes`, `station-reflection-readiness`, `torii-materials-nodes` y `seasons-subcells`.

## Qué queda pendiente al cambiar de chat

1. Confirmar comportamiento en Mac/Metal: no hay benchmark en Mac todavía.
2. Medir defaults y experimentos por separado, con esperas controladas y sin observador de builds. No habilitar headroom/cull globalmente solo porque los tests pasan.
3. Capturar la identidad de los builders que siguen entrando durante render y comprobar si faltan en el registro, si la cola no llegó o si cambia una variante. Ampliar ownership solo con evidencia; no convertir snapshots de actores animados en culling estático.
4. Considerar priorización/cobertura por ángulo y una aproximación continua, con presupuesto CPU real. La cola serial actual y el render saturado pueden seguir llegando tarde a una exposición súbita.
5. Validar cerca visualmente, sombras bajas, reflejos, foto/zoom, resize, BFCache y cambios de calidad. Los tests geométricos y la revisión estática no sustituyen esa QA.
6. Terminar mediciones calientes y un recorrido normal representativo antes de afirmar que se fueron los tirones. El usuario autorizó seguir avanzando hasta algo fluido, sin bajar la calidad.

Los archivos grandes de evidencia permanecen **solo en Windows** bajo `outputs/hitch-audit-2026-10-26/`, `outputs/shadow-subcells-2026-10-26/`, `outputs/movement-hitches-2026-10-26/` y `outputs/prewarm-improvement-2026-10-26/` (ignorados). No asumir que existen en Mac. El JSON portable y este documento preservan lo necesario para continuar sin rehacer las investigaciones cerradas.

Skills sugeridos: `systematic-debugging`, `test-driven-development` para regresiones concretas y `verification-before-completion`. La intención/diseño ya están aprobados: no reiniciar una ronda de brainstorming sobre si vale la pena investigar performance.
