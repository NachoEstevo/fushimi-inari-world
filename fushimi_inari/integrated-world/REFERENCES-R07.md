# Revisión 07 — superficies, bosque y sectores — 2026-10-20

## Cambios y conservación

Los HTML originales, GLB, Blender y texturas originales permanecen intactos.
Los cambios se aplican en el adaptador integrado. Se conservan las variantes
de torii, interacciones, minimapa, checkpoints, audio y caminos anteriores.

- Los perfiles sin cantidad cartografiada ahora pasan por las cotas de cada
  vértice intermedio, incluso si principio y final tienen la misma altura.
  Los conteos cartografiados válidos se conservan. Los 52 perfiles inciertos
  siguen requiriendo evidencia: el DEM de 10 m no resuelve cada contrahuella.
- Las uniones de pavimento usan esquinas compartidas en los giros ordinarios;
  los cambios extremos de dirección conservan un límite para evitar puntas.
- Granito fino en contrahuellas, peldaños de las tres cumbres y piedra del Rōmon. Grava en el entorno
  inmediato del patio original y hojarasca a menor escala fuera de él.
  La extensión de grava es una aproximación al patio, no una parcela relevada.
- El GLB del Rōmon tiene un podio de 2,10 m y el piso anterior terminaba a
  1,60 m en coordenadas de autoría. Un adaptador de escalones conecta ambos
  lados del umbral sin modificar el GLB. Es reparación de continuidad del
  modelo, NO medición de los escalones reales.
- Copas de hoja perenne volumétricas, entre 3 y 5 grupos por árbol, con
  variación de apertura, altura, orientación y tamaño. Tres niveles de detalle,
  con histéresis, mantienen las siluetas lejanas. El sotobosque original se
  conserva. Son aproximaciones botánicas, todavía no vegetación fotorrealista.
- Fascias, alféizares y bajantes en las casas de té existentes. Pliegues en
  las cortinas de los tres santuarios; Ninomine se diferencia en rosa,
  conservando la caligrafía y los emblemas originales.

## Referencias efectivamente consultadas

- [Mapa y fotografías oficiales](https://inari.jp/trip/map01/): fotografías
  `sakuramon.jpg`, `ichinomine.jpg`, `ninomine.jpg`. Piedra del acceso,
  cortinas y diferencias entre fachadas. Las imágenes son pequeñas y no
  sirven para extraer dimensiones exactas.
- [Guía de Okumura-tei](https://www.kanshya.com/13course.html): recorrido y
  relación con la escalera a Tanakasha. El intento de abrir su galería en
  navegador agotó el tiempo de carga; no se afirma una inspección nueva
  de sus fotografías.
- [Yotsutsuji en Maps](https://www.google.com/maps/search/?api=1&query=Yotsutsuji+Fushimi+Inari):
  Street View y 360°, Shigeo Sawada, marzo 2022,
  `CIHM0ogKEICAgICWw6fNmwE`; se giró la vista hacia el pavimento, vegetación
  de talud y bases de torii. Segundo panorama: Takanori Kono, abril 2024,
  `CIHM0ogKEICAgICj1pGumgE`; terraza y escaleras. No es un recorrido continuo
  de Street View de toda la montaña.

Los detalles de bajantes y los pliegues son interpretativos. No se copiaron
fotografías de referencia al repositorio.

## Rendimiento

Terreno y caminos divididos en sectores de 160 m; arquitectura estática e
instancias originales en sectores de 128 m. El bosque agregado conserva
celdas de 80 m y usa copas de 192/48/12 hojas según distancia. La selección
por encuadre conserva triángulos completos, UV y normales. No se recorta la
visión con niebla ni se borran caminos lejanos. Esto es partición de render,
no descarga de memoria ni streaming desde disco.

Se añadió `data-render-stats` al DOM para medir llamadas, triángulos, FPS,
tiempo de envío desde CPU, resolución y visibilidad. CPU no equivale a tiempo
de GPU. Las capturas locales y las mediciones están en `outputs/r07-*`.
La primera configuración de 80 m redujo Yotsutsuji de 10.904.576 a
4.556.278 triángulos, pero aumentó llamadas de 433 a 718; por eso se
ampliaron los sectores. No se deduce una mejora proporcional de FPS.
La configuración final en el mismo checkpoint de Yotsutsuji dibuja
4.598.468 triángulos y 547 llamadas: aproximadamente 58% menos triángulos
que r06. La muestra final registró 106 FPS frente a 165 en la muestra
inicial; no demuestra una mejora de fluidez y requiere perfilado de GPU
en condiciones controladas. La partición tampoco reduce la memoria cargada.
Una segunda muestra, tras cerrar Maps, registró 138 FPS y 4,95 ms de envío
CPU con idénticos 547 dibujos y 4.598.468 triángulos. Esa variabilidad impide
atribuir la fluidez solamente al tamaño de los sectores.

## Validación y límites

35 pruebas automatizadas de geografía, superficies, colisión, torii y
movimiento. Prueba adicional local con Three r164 de conservación de
triángulos, UV, límites, matrices y colores al dividir mallas/instancias.
Revisión visual secuencial de entrada, Senbon, Yotsutsuji y subida; paso
manual por el Rōmon y escalera de Yotsutsuji. Los hashes de ambos visores
originales siguen coincidiendo con r06.
El recorrido guiado de 1,89 km llegó a Ichinomine (231,2 m en el DEM).
Los acabados finales de Ninomine e Ichinomine se inspeccionaron en el visor.

La auditoría del ascenso/retorno muestrea 11.609 posiciones: máximo salto
0,305 m, ninguno mayor de 0,40 m. Es una comprobación virtual, no una norma
de accesibilidad ni un relevamiento de terreno. La fidelidad exacta de
cubiertas, interiores de casas de té, todos los perfiles secundarios y
la distribución de plantas sigue pendiente. No se probó hardware móvil.
