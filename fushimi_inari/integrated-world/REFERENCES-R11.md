# Revisión 11 — cortinas, perfiles intermedios y ofrendas

## Correcciones

- Rōmon: los cilindros azules originales coincidían con la cara del panel
  (z GLB 2,5699997 frente a 2,5699999). Esa coincidencia producía z-fighting.
  El adaptador elimina exclusivamente 552 triángulos de esas tres cortinas
  y emblemas, y agrega 96 triángulos de tela con tinta en la misma textura.
  Conserva el círculo del autor; no certifica que sea el blasón histórico exacto.
  La tela es mate y ligeramente plegada. Blender y GLB originales intactos.
- Escaleras estimadas: muestreo de terreno cada 5 m como máximo dentro de
  segmentos OSM largos, conservando todos sus vértices y curvas. No añade
  resolución al DEM de 10 m ni equivale a un levantamiento de escalones.
  Los conteos cartográficos compatibles conservan su tratamiento anterior.
- Mitsurugi: ofrendas torii abiertas con dos postes y dos travesaños en lugar
  de bloques sólidos. Conserva ubicación, material y tamaño del modelo previo.
  Geometría compartida y agrupación espacial existente, sin nuevas dependencias.

## Referencias

- Google Maps, Mitsurugi Shrine, panorama de Luke Hall, abril de 2018,
  `CIHM0ogKEICAgICk9Jv8wgE`, posición 34.9685908, 135.7859655.
  Se inspeccionó y giró el panorama: altares pétreos, pequeñas ofrendas torii
  abiertas, árboles y ladera. No permite certificar cotas ni distribución actual.
- https://livingkyo.com/en/6058/ — recorrido publicado el 16/09/2025,
  Mitsurugi–Ichinomine y tres cumbres; contraste documental de secuencia.
- https://zuttokyoto.com/en/fushimi-inari-taisha-course/ — referencia adicional
  del itinerario. No se extrajeron alturas de estas fotografías.

## Validación y límites

41 pruebas pasan, incluida una regresión de pendiente interior en un tramo
largo con extremos a igual altura. Cortinas comprobadas desplazando la cámara
a izquierda y derecha, sin la interferencia mostrada en la captura del usuario.
Auditoría de altura: 11.609 muestras, máximo 0,305 m, ningún salto >0,4 m.
Colisiones: 2.323 muestras, ningún bloqueo. Los dos HTML originales mantienen
sus hashes registrados. No se abrieron instancias adicionales.

Yotsutsuji, cámara 801,41;165,95;-213,32, 1205×812, DPR1: muestra R11
159,7 FPS, envío CPU 4,74 ms, 558 llamadas, 4.508.701 triángulos.
Comparación R10: 164,3 FPS, 3,50 ms, 567 llamadas, 4.507.369 triángulos.
Variación de una muestra; no demuestra ausencia de regresión en todos los equipos.

`stair-review.json` actualizado: siguen 52 perfiles sin medición suficiente,
10 detectados próximos al itinerario principal/regreso. No se cerraron como
medidos. Quedan relevamiento de descansos, alturas y disposición particular
de los recintos. En inspección orbital de Mitsurugi, alejar mucho la cámara
permite atravesar la ladera y ver el reverso del terreno: pendiente específico
de cámara orbital, no validado como corregido en esta revisión.
