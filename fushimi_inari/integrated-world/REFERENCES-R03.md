# Referencias y revisión 03 — 2026-10-20

## Qué procede del proyecto anterior

Se mantienen el master Blender, los dos HTML originales, sus texturas, los cuatro
GLB principales, los constructores de altares, santuarios, casas de té, faroles,
kitsune, cuerdas, velas, carteles y las interacciones. `integration.mjs` reutiliza
esas piezas mediante transformaciones rígidas. `legacy-source.sha256` permite
comprobar la fuente. El checkpoint r02 está en `outputs/checkpoints/`.

Los torii pequeños de Senbon se refinan geométricamente porque escalar el modelo
anterior daba columnas y proporciones incorrectas. Los torii grandes de montaña
reutilizan la geometría y los materiales anteriores. La colocación comprimida se
sustituye por estaciones a lo largo de los caminos conectados.

## Evidencia consultada

- [Mapa oficial](https://inari.jp/trip/map01/): organización del recinto, cumbres,
  nombres y conexiones del circuito de peregrinación.
- [Senbon, santuario oficial](https://inari.jp/en/map/spot_07/): identidad del sector.
- [Entrevista a Minoru Hasegawa, 2026](https://8984.jp/machi/2026/10/000650.html):
  el constructor describe columnas de aproximadamente 15 cm para los torii de
  tamaño 5 de Senbon. Las fotos documentan montaje, bases, escalones y pintura.
- [Catálogo de torii de madera](https://tomiyahonten.com/products/torii/): referencia
  comparativa para proporciones de tamaño 5; NO son medidas levantadas en Fushimi.
- [Fotografía de las dos ramas](https://commons.wikimedia.org/wiki/File:Double_torii_path_at_Fushimi_Inari_Taisha_Shrine,_Kyoto,_Japan.jpg).
- Google Maps, ficha Senbon Torii, sección **Street View & 360°**, inspeccionada
  en el navegador y girada; tres panorámicas: 蘇薇薇 (octubre 2016), Aquiloni Pano
  (octubre 2022), Avtar Chan (captura noviembre 2022/publicación enero 2023).
  Se revisaron interior, pavimento, bases y vista lateral con vegetación.
  Son panorámicas de usuarios, no un levantamiento continuo de todo el monte.
  El enlace por coordenadas inicialmente abrió una foto de otro sector y no se
  usó como prueba de localización de Senbon.
- [Google Maps: Senbon](https://www.google.com/maps/search/?api=1&query=Senbon+Torii+Fushimi+Inari).
- [Estudio histórico de vegetación de Kyoto](https://kaken.nii.ac.jp/file/KAKENHI-PROJECT-17510025/17510025seika.pdf):
  contexto regional, no inventario actual de árboles ni autoridad para su posición.

## Contrato y alcance

`route-spec.mjs` es el contrato en metros de esta revisión. Los tramos OSM
`way/260121328` y `way/377968455` contienen notas de un relevamiento de **2014-08-16**:
382 torii y 396 pequeños más 3 grandes. La revisión usa 781 en total. El conteo
es histórico; su vigencia actual y las posiciones individuales NO están verificadas.

Diámetro pequeño: 0,15 m, respaldado por la entrevista. Altura 2,55 m, separación
entre ejes 1,82 m y luz bajo travesaño 1,98 m: **inferidas**, pendientes de medición
local. Los empalmes de ambas ramas quedan libres. La posición de los tres torii
grandes de la segunda rama es aproximada. No se inventan nombres de donantes.

Las escaleras se generan sólo donde OSM marca `highway=steps`. Se conserva
`step_count` cuando existe; el resto se calcula del desnivel y una contrahuella
objetivo. El DEM de 10 m no acredita el perfil de cada escalera. Los casos con
altura incompatible o casi nula se registran en `unresolvedStairProfiles`.
La cámara, pavimento y corte del terreno consultan la misma red de superficies.

El bosque nuevo reutiliza troncos, copas y sotobosque anteriores. Añade masas
irregulares próximas al camino y copas altas, respetando agua, edificios y
explanadas. No es una distribución botánica medida: especies, densidad por sector,
árboles singulares y bambusales específicos necesitan una revisión propia.

## Pendientes para poder llamarlo réplica completa

1. Calibrar el circuito con medidas locales, perfiles de escaleras y descansos.
2. Relevar las posiciones y tamaños actuales de torii por tramos, incluidos los
   accesos antes de Senbon y los huecos reales del circuito superior.
3. Revisar las terrazas y conexiones de Yotsutsuji, Kumataka y los altares superiores.
4. Documentar y modelar los senderos laterales, cascadas y santuarios menores que
   sólo tienen posición o camino cartográfico, sin geometría detallada específica.
5. Inventariar especies y masas vegetales por sector; sustituir copas provisionales.
6. Contrastar fachadas, muros, drenajes, barandas, señalización y entorno urbano.
7. Revisar todos los accesos a pie, rendimiento sostenido y dispositivos móviles.
8. Ajustar materiales e iluminación con cámaras de comparación consistentes.

No se considera cerrado el objetivo de reproducir todo el predio igual a la realidad.

## Comprobación final

22 pruebas pasan; circuito guiado de 3,91 km completado por segunda rama; WASD probado en Senbon e interacción E comprobada en Ichinomine. Auditoría del eje de ascenso y retorno: 1.955 muestras, cero correcciones superiores a 0,35 m (máxima 0,322 m). No equivale a una caminata manual de todos los senderos. Cuatro vistas revisadas secuencialmente: Romon, Senbon, Yotsutsuji y cima. No se afirma equivalencia fotográfica.

Se registraron 52 perfiles de escaleras de la zona de estudio que no pueden resolverse con seguridad combinando el DEM y los conteos OSM. También quedan por ajustar las terrazas de casas de té y la vegetación heredada sobredimensionada visible junto al acceso. Evidencia en outputs/integrated-r03-validation.json y capturas integrated-r03-*.png.

