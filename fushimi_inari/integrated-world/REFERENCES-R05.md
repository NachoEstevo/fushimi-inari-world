# Revisión 05 — Yotsutsuji y navegación — 2026-10-20

## Evidencia y alcance

Se revisó de nuevo la galería Street View & 360° de
[Yotsutsuji en Google Maps](https://www.google.com/maps/search/?api=1&query=Yotsutsuji+Fushimi+Inari):
panoramas Shigeo Sawada (marzo 2022) y Takanori Kono (abril 2024,
CIHM0ogKEICAgICj1pGumgE). Se giró este último para observar el ascenso
oriental, las fachadas y toldos de las casas de té, el anexo occidental,
el descenso y la vista hacia Kyoto. Son panoramas de colaboradores, no
un recorrido continuo ni un levantamiento métrico.

La galería de [Nishimura-tei](https://www.google.com/maps/search/?api=1&query=Nishimura-tei+Fushimi+Inari)
mostró una fotografía interior (空ノ音, enero 2026; captura indicada junio
2023). No se modeló el interior ni se la considera evidencia geométrica.
No se incorporaron imágenes de Maps como texturas o archivos del repositorio.

Las tres plantas siguen los polígonos OSM 301527779, 626313775 y 626313685.
La casa del ramal norte se identifica como Okumura-tei; las dos plantas
al sur corresponden a Nishimura-tei y su anexo. Alturas, ventanas, cubiertas
y cotas de apoyo siguen siendo inferencias. Las cubiertas son simplificadas.

Se reemplazó el aplanamiento circular de Yotsutsuji por una explanada
acotada al cruce, preservando los perfiles de las escaleras adyacentes.
Se comprueban específicamente los tramos cartografiados de 10, 25 y 60
peldaños; no equivalen a un relevamiento de cada contrahuella.
Ocho torii reutilizan la geometría y los acabados originales en accesos locales.

## Preservación y navegación

Los originales HTML, texturas, modelos y master Blender permanecen intactos.
La integración sustituye los volúmenes genéricos de estas casas y la gran
losa genérica del mirador, conservando bancos, noren, lámparas e interacciones.
Corrige el datum vertical usado para trasladar los accesorios de las casas.

Minimapa persistente con tres escalas, posición y orientación; 22 destinos,
10 botones directos; velocidades 1,6 / 3 / 6 / 10 m/s y Shift ×1,5.
Movimiento rápido subdividido en pasos de hasta 12 cm para las colisiones.
Los teletransportes buscan apoyo libre y activan el modo a pie.
El ascenso y el retorno alternativo mantienen el grafo previo de caminos OSM.

## Verificación y pendientes

28 pruebas automáticas aprobadas. Auditoría en navegador: 2.317 muestras,
incluidas 362 de ramales locales, ninguna corrección de colisión superior a
0,35 m (máxima 0,304 m). Los 22 destinos se probaron por controles visibles.
WASD durante un segundo desde Rōmon recorrió aproximadamente 3 y 10 m al
cambiar la velocidad; el minimapa actualizó su posición. Contraer/expandir
funciona. No hubo errores ni advertencias de consola en la revisión.

No se acredita un paseo manual completo por cada camino ni QA móvil.
Persisten 52 perfiles de escaleras sin resolución suficiente del DEM.
Faltan cubiertas y fachadas detalladas, interiores, inventario fiel de árboles,
muros y pequeños santuarios, y precisión de microtopografía fuera del cruce.
El terreno GSI de 10 m y OSM permiten conectar el recorrido, pero no garantizan
una réplica métrica del predio completo. La vegetación y muchos detalles
arquitectónicos siguen siendo interpretativos.
