# Revisión 06 — subida, bosque y ambiente — 2026-10-20

## Escaleras y caminabilidad

Se revisaron los 52 perfiles marcados por el modelo. Nueve tienen conflicto
entre step_count de OSM y desnivel del DEM: 301527765, 439990443, 439990444,
439990449, 439990450, 439990452, 649037624, 1275931671 y 1402555559.
Ahora usan cantidades inferidas transitables, conservando el valor de origen
y el conflicto en `correctedStairProfiles`. No se alteró OSM.

El tramo 649037624, después de Yotsutsuji, producía diez contrahuellas de
aproximadamente un metro. Ahora se divide en 66 peldaños estimados. No se
afirma que ésa sea la cantidad real. Los perfiles corregidos pasan por las
cotas de cada vértice cartográfico: la unión con 1284140139 ya no cae un
metro por debajo de la escalera 439990449. El muestreo de pisos históricos
descarta superficies elevadas que requerían saltar más de 24 cm sobre el
apoyo previo/base. No se borran los objetos históricos.

La auditoría de 11.609 posiciones, cada 25 cm aproximadamente en el ascenso
y retorno, pasó de cuatro saltos >40 cm (máximo 1,093 m) a ninguno
(máximo 0,338 m). Esta tolerancia es de verificación virtual, no una norma
arquitectónica ni una garantía de exactitud.

Los 52 perfiles continúan marcados como inciertos: corregir la caminabilidad
no resuelve la evidencia topográfica. Muchos restantes están en la zona
urbana periférica y el DEM apenas distingue su desnivel.

## Referencias inspeccionadas

- [Ichinomine en Google Maps](https://www.google.com/maps/search/?api=1&query=Ichinomine+Fushimi+Inari):
  galería Street View & 360°, Naoki SATONAKA, noviembre 2018,
  panorama CIHM0ogKEICAgICEyJ23-wE. Frente del santuario, peldaños anchos
  de granito, linternas, descenso entre pequeños altares. Se giró la vista;
  parte del panorama lateral cargó borrosa.
- [Ninomine en Google Maps](https://www.google.com/maps/search/?api=1&query=Ninomine+Fushimi+Inari):
  galería Street View & 360°, shin kane, febrero 2020. Terraza enlosada,
  escalera lateral estrecha bajo cubierta verde y relación entre torii,
  puesto y pequeños altares. No se recorrió una cadena continua de Street View.
- [Recorrido fotográfico de Zaucats, febrero 2013](https://www.zekkeikana.com/kyoto/komichi/oyamameguri/oyamameguri3.html):
  secuencia Nishimura-tei → Sannomine → Ainomiya → Ninomine → Ichinomine.
- [Accesos documentados por Okumura-tei](https://www.kanshya.com/13course.html):
  secuencia de accesos y localización de la casa a mitad de la escalera
  hacia Tanakasha. Se conserva la documentación visual de r04/r05.

Las imágenes de referencia no fueron copiadas al repositorio. Cubiertas,
montantes, aleros y sus refuerzos en las casas de té son inferencias sobre
las plantas previas. Se corrigió la triangulación de las cubiertas para que
la cumbrera exista, cerrando los hastiales. Se mantienen bancos, lámparas,
noren y materiales originales. Las cámaras de visita ahora quedan fuera
de las plantas ampliadas.

## Vegetación

[Kyoto, catálogo de candidatos a 100 seres vivos](https://www.city.kyoto.lg.jp/templates/shingikai_kekka/cmsfiles/contents/0000191/191476/shiryo2_sanko1.pdf),
entrada 稲荷山の森（照葉樹林）, identifica shii y kashi.
Se cambia el bosque agregado a predominio de hoja perenne: 8.956 de 11.732
árboles, proporción de diseño NO censada. Las copas nuevas tienen hojas
lanceoladas/elípticas y ramas; ya no usan un helecho agrandado como copa.
Se conserva el sotobosque y los árboles originales. Son representaciones
procedurales, no ejemplares botánicos escaneados ni posiciones relevadas.
El sotobosque original todavía requiere identificación de especies y mejora.

## Sonido

Primer ambiente de **primavera**, activado únicamente por el usuario.
Grabación real de uguisu, con separación espacial y pausas de 14–40 segundos;
no canta en el modo nocturno. El registro de especies de la excursión
Tofukuji–Inariyama del 11 de octubre de 2020 de
[Kyoto Gakuren](https://kyoto-gakuren.jp/w/wp-content/uploads/2020/11/ba29e800d620169b8116ef040ca73f3d.pdf)
incluye uguisu, shijūkara, mejiro, hiyodori y otras aves. Sólo uguisu se
incorpora en esta entrega; no se sintetizan aves genéricas atribuyéndoles
identidad real.

La grabación de Koba-chan procede de Kantō (2005), no del santuario.
Su licencia CC BY-SA 3.0, autor y origen están en `assets/audio/CREDITS.md`
y accesibles desde el visor. Se conserva intacta y sin transposición tonal.
Brisa filtrada con intensidad lenta variable; campanillas sintetizadas,
opcionales y limitadas a las proximidades de las casas. Estas campanillas
son una interpretación ambiental, no una instalación verificada.
Se mantienen las acciones originales de campana, agua y pasos; los pasos
a pie distinguen pavimento y tierra.

## Verificación y límites

32 pruebas de geografía, rutas, superficies, perfiles, colisiones y movimiento.
Inspección guiada completa desde el acceso hasta Ichinomine (1,89 km de
itinerario), con observaciones intermedias y llegada visible. Pruebas WASD
en Yotsutsuji, Sannomine, Ninomine e Ichinomine. No equivale a recorrer a
mano todos los ramales.

Se verifican carga y decodificación del Ogg, controles de audio, silencio,
modo nocturno y ausencia de errores de consola. La mezcla requiere escucha
del usuario con sus auriculares/altavoces; no se afirma una evaluación
auditiva subjetiva ni equivalencia acústica con Inariyama.

Pendientes: microtopografía medida, descansos y muros reales de cada tramo,
fachadas/interiores completos, copas y sotobosque de mayor fidelidad,
otras especies sonoras con grabaciones acreditadas, QA móvil y recorrido
manual de todos los caminos. El master Blender y los viewers originales
permanecen intactos. Esta revisión sigue siendo una reconstrucción parcial.
