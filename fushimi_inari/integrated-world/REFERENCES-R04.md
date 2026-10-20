# Revisión 04 — torii y apoyo del terreno — 2026-10-20

## Corrección respecto a r03

El error de r03 fue forzar 781 puertas históricas dentro de los tramos recortados
de Senbon. Las notas OSM de 2014 se conservan como metadatos; no determinan la
cantidad renderizada. Ahora hay 239 puertas (146 limpias, 93 envejecidas), con
intervalo nominal de 0,57 m, mínimo de 0,43 m y pequeños claros entre grupos.
Estos intervalos son ajustes visuales inferidos, no medidas del sitio.

Se reutilizan los mapas originales Torii_Kanji_Column y
nanobanana/torii_weathered_kanji, con normales, rugosidad y tintes independientes.
Se modera el contraste exagerado de madera desnuda del mapa envejecido. Los
travesaños pequeños tienen material propio para evitar inscripciones estiradas
sobre todas las vigas. Se conserva la geometría original para los 1.321 torii
grandes: 572 ahora usan el acabado envejecido. La distribución por sectores,
alturas ±3,5 %, anchos ±2 % y pequeñas rotaciones es determinista e interpretativa.

El paso y las colisiones usan las mismas transformaciones. No se ha sustituido
el master, las texturas originales ni los HTML anteriores.

Las contrahuellas toman la altura efectiva de cada escalón y se dibujan en el
extremo correcto al bajar; antes todas eran de 23 cm y estaban en el extremo
inicial. Se agregaron faldones de mampostería bajo 17 losas originales expuestas,
hasta el terreno. Esto corrige apoyos visuales; NO acredita la forma real de
los muros ni resuelve por sí solo la ubicación de las casas de té.

## Referencias inspeccionadas en esta revisión

- [Mapa oficial del santuario](https://inari.jp/trip/map01/): conexiones,
  santuarios y descripción de Kumataka sobre un basamento de piedra junto al lago.
- [Google Maps / Yotsutsuji](https://www.google.com/maps/search/?api=1&query=Yotsutsuji+Fushimi+Inari),
  galería **Street View & 360°**:
  - Shigeo Sawada, marzo 2022, panorama `CIHM0ogKEICAgICWw6fNmwE`:
    puertas vecinas con distinto acabado, bases manchadas, talud con raíces,
    hojarasca y musgo. Coordenada mostrada 34.9693137, 135.7811974.
  - Takanori Kono, abril 2024, panorama `CIHM0ogKEICAgICj1pGumgE`:
    plaza, ascenso de escalones y lateral con casa de té. Se giró la vista para
    revisar su relación espacial. Coordenada mostrada 34.9690403, 135.7814928.
  Son panorámicas de usuarios; no un levantamiento métrico ni un recorrido
  continuo de Google. Las imágenes se consultaron, no se incorporaron como
  texturas ni se subieron al repositorio.
- Se mantiene el catálogo de referencias de r03. La entrevista de Hasegawa
  no volvió a cargar en esta revisión; no se obtuvo evidencia nueva de ella.

## Verificación y límites

24 pruebas de geografía, accesos, rutas alternativas, alturas, colisiones,
espaciado y variaciones. Auditoría del eje de ascenso y retorno: 1.955 muestras,
0 correcciones mayores que 0,35 m; máxima 0,304 m. Prueba WASD en Senbon.
Inspección visual de Senbon y Yotsutsuji. Esto no equivale a caminar manualmente
todos los senderos ni a validar cada edificio contra fotografías.

La revisión visual confirma que Yotsutsuji todavía difiere notablemente de la
panorámica: falta reconstruir la disposición precisa del cruce, fachadas,
descansos y accesos laterales. No se cambiaron esas ubicaciones por conjetura.
Los 52 perfiles de escaleras irresueltos siguen pendientes; el DEM de 10 m no
permite deducir sus descansos. Caminos secundarios conservados y conectividad
probada, pero sin relevamiento visual completo de cada ramal. Vegetación,
iluminación, inscripciones individualizadas y el inventario real de puertas
todavía requieren trabajo. La réplica completa no está terminada.

## Versionado

Repositorio privado: https://github.com/NachoEstevo/fushimi-inari-world

`r03-baseline` conserva la implementación anterior a estos cambios.
Se versionan master Blender, modelos, texturas, originales, scripts y datos.
Se excluyen fotos descargadas, capturas, backups duplicados y archivos de
credenciales. No se concede licencia pública sobre material de terceros.
