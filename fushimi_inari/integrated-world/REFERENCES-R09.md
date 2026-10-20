# Revisión 09 — revisión visual, perfiles y follaje

## Evidencia y límites

Comparación visual con el panorama de Ninomine ya abierto en Google Maps:
shin kane, febrero de 2020, panorama `CIHM0ogKEICAgICs5d_xggE`.
Se observan el torii de acceso, juntas del pavimento, escalera cubierta lateral,
patina de cubiertas y arbolado de invierno. No permite medir contrahuellas ni
justifica alterar las cotas del DEM. La silueta frontal se contrasta además con
la fotografía oficial de Ninomine registrada en REFERENCES-R08.md.
El bosque conserva la referencia botánica municipal shii/kashi de R07; esta
pasada no incorpora un censo de árboles ni nuevas especies verificadas.

## Cambios

- Nubes más bajas para ser visibles al caminar, conservando cuatro grupos y
  una sola llamada de dibujo. Comprobadas de día y de noche; atardecer revisado.
- Frontones con remate de madera que sigue la curva; recuperación de la textura
  de cubierta original de la capa superior, en lugar de extender el cobre
  verdoso sobre toda la cubierta. Dimensiones interpretativas, no medidas.
- Hojas cercanas más pequeñas: 384 hojas de dos triángulos en vez de 192 de
  cuatro, igual presupuesto de triángulos cercano. Variación tonal por copa
  consistente entre los tres LOD. Conserva árboles, posiciones y sotobosque.
- Escaleras con conteos cartografiados distribuidas por vértices intermedios,
  respetando cambios de pendiente. Conteos incompatibles se marcan como conflicto
  y usan la estimación existente. 4.228 peldaños, 52 perfiles inciertos y 12
  conflictos detectados: no son 52 perfiles resueltos ni escaleras medidas.
- Pestañas ocultas omiten render/actualización de escena. Sin nuevas instancias
  de navegador. Se mantuvo una sola escena WebGL y la referencia ya abierta.
- Se versionaron las importaciones afectadas por un error reproducido de caché
  (módulo nuevo con dependencia anterior). La carga final completó correctamente;
  el error anterior permanece en el historial de consola, sin nuevas entradas.

## Verificación

38 tests, sintaxis y revisión de diff. Recorridos cartográficos conservados.
Revisión secuencial de Ninomine, Ichinomine, Senbon y Yotsutsuji, más la entrada.
Prueba WASD en Yotsutsuji: de (801,41; 165,95; -213,32) a
(806,86; 166,62; -213,65). Auditoría de altura: 11.609 muestras,
salto máximo 0,305 m y ninguno mayor a 0,4 m. Auditoría de colisiones:
2.318 muestras, cero bloqueadas. Son controles de continuidad del modelo,
no una validación topográfica del lugar real.

Muestra de rendimiento tras caminar: 515 llamadas, 4.123.128 triángulos,
157 FPS, 5 ms de envío CPU a 1017 × 812 y DPR 1. Pose/viewport diferentes
a R07: no es un benchmark comparable ni una mejora de FPS demostrada.

Pendientes: copas todavía ralas y estilizadas, articulación de aleros y
carpinterías por santuario, escalones en giros que conservan bordes angulosos,
52 perfiles sin evidencia suficiente y fidelidad completa del predio.
Capturas locales en outputs/r09-ninomine.png y outputs/r09-entry.png.
