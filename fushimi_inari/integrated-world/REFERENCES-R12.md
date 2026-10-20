# Revisión 12 — cámara, perfiles y entorno de Mitsurugi

## Fuentes y alcance

Se volvió a inspeccionar y girar Street View de Mitsurugi, Luke Hall,
abril de 2018, panorama `CIHM0ogKEICAgICk9Jv8wgE`,
34.9685908, 135.7859655. Se distinguen estelas de remate redondeado,
torii pequeños, escalones entre altares, ladera arbolada y cubiertas curvas
oscuras. Parte de la imagen carga borrosa: no se usó para medir alturas ni
contar todos los escalones. Referencia documental oficial consultada:
https://inari.jp/trip/map01/ (Mitsurugi, tres cumbres y santuarios secundarios).

Las geometrías continúan siendo interpretativas. Se preservan plantas,
posiciones, inscripciones, ofrendas e interacciones anteriores. No hay nuevas
cotas medidas ni nuevos caminos inventados para cerrar desconexiones.

## Implementación

- Cámara orbital: límite inferior calculado sobre el mismo terreno adaptado,
  con nueve muestras alrededor del ojo y margen vertical de 1,2 m. Se aplica
  después de OrbitControls; no modifica la cámara a pie ni el recorrido guiado.
  Evita el caso reproducido de atravesar la ladera al alejarse de Mitsurugi.
  No equivale a colisión con paredes y techos de todos los edificios.
- Perfiles con conteos OSM: verificación de alturas intermedias cada 5 m,
  manteniendo el total cuando la asignación de tramos es compatible. Cuando
  no lo es, se conserva el conteo fuente y se declara el perfil estimado.
  Este criterio también depende de la discretización; no demuestra que OSM
  esté equivocado ni que los escalones reales tengan las alturas del DEM.
- Informe actualizado: 54 perfiles pendientes (antes 52). Nuevos casos:
  `way/439990448` cerca de Senbon y `way/1276691447` en los alrededores.
  Ninguno se presenta como medido o resuelto por inspección fotográfica.
- Mitsurugi: estelas periféricas con coronación redondeada, manteniendo
  dimensiones y escala métrica de textura. Cubierta curva oscura y pliegues
  en la cortina; conserva el contenido original del recinto.
- Minimapa: agua y puntos secundarios ya presentes en OSM, etiquetas limitadas
  por celdas para reducir superposición, accesos restringidos según `foot`
  o `access`, y trazos discontinuos para puentes/túneles. Es representación
  cartográfica; no afirma que todos esos edificios estén reconstruidos en 3D.

## Verificación

44 pruebas pasan, incluidas cámara sobre pendiente y perfil con cota intermedia
oculta por extremos de igual altura. Sintaxis y diff revisados. Originales
HTML verificados por SHA256, sin cambios. Revisión visual secuencial frontal,
lateral, posterior y elevada en Mitsurugi, reutilizando las dos pestañas.
La cámara se mantuvo sobre la ladera en el alejamiento que antes fallaba.
Auditoría de altura: 11.609 muestras, salto máximo 0,305 m, ninguno >0,4 m.
Colisiones: 2.323 muestras, ningún bloqueo. Recorrido guiado de 1,89 km
completado hasta Ichinomine (llegada 231,2 m según escena). Consola sin errores
en la captura de esta sesión. Minimapa comprobado en escala de sector.
Muestra estabilizada en Yotsutsuji, cámara 801,41;165,95;-213,32, 1205×812,
DPR1: 165 FPS, 3,61 ms CPU, 582 llamadas y 4.518.694 triángulos. Es una
muestra local, no un benchmark universal. La protección orbital realiza
nueve consultas de altura, sin raycast global sobre la escena.

Pendientes de réplica: alturas individuales de descansos y escalones,
distribución exacta de altares y edificios menores, vegetación por ejemplar,
cotas en los perfiles marcados y colisiones orbitales con arquitectura.
No se declara terminado el predio entero.
