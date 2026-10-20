# Revisión 10 — curvas, copas y diferencias entre santuarios

## Fuentes consultadas

- Panorama existente de Ninomine, shin kane, febrero de 2020,
  Google Maps `CIHM0ogKEICAgICs5d_xggE`: al girar hacia la linterna se distinguen
  techo a dos aguas, marcos y paneles. No aporta medidas verificadas.
- Fotografías oficiales desde https://inari.jp/trip/map01/:
  `https://inari.jp/wp/wp-content/themes/inari/images/trip/map01/sannomine.jpg`
  y `https://inari.jp/wp/wp-content/themes/inari/images/trip/map01/ichinomine.jpg`.
  Sannomine muestra postes grises y cajas oscuras; Ichinomine una cubierta
  ancha sin el frontón proyectado añadido en la adaptación anterior.
  Son imágenes pequeñas: útiles para distinguir siluetas, no para medir.

## Cambios conservando los originales

- Giros cerrados: ambos segmentos comparten una bisectriz limitada. El método
  anterior volvía a normales diferentes y podía dejar un hueco triangular.
  Las inversiones completas de 180 grados siguen necesitando un descanso
  diseñado específicamente; el test cubre giros de 125, 145 y 165 grados.
- Huellas de granito sin la textura de juntas de losas que atravesaba los
  escalones. Se reutiliza el material de contrahuellas y su agrupación espacial.
- Copas: grupos volumétricos de hojas perennes con silueta recortada por alfa,
  textura compartida de 128 px y tres niveles de detalle. El presupuesto de
  triángulos se conserva; aumenta cobertura, no cantidad de árboles. Es una
  aproximación visual a shii/kashi, no una reconstrucción botánica individual.
- Ninomine: linternas con cubiertas curvas a dos aguas y paneles enmarcados.
  Sannomine: postes grises, marcos oscuros. Ichinomine: cubierta más baja y
  ancha, sin el frontón proyectado genérico. Conserva placas, cortinas,
  campanas, altares e interacciones. Medidas locales interpretativas.

## Los 52 perfiles: auditoría individual, no cierre ficticio

`stair-review.json` contiene todos los casos con enlace OSM, longitud, cotas
DEM originales y adaptadas, conteo publicado y generado, contrahuella máxima,
huella mínima, santuario cercano y motivo. Se genera desde la escena cargada.

10 de los 52 están a menos de 12 m del recorrido principal o de regreso;
el resto corresponde a ramales y alrededores dentro del área de estudio.
43 tienen altura de extremos no resuelta, 12 conflicto de conteo y 5 incluyen
modificación por nivelación local. Las categorías se superponen.
No se alteraron cotas para reducir artificialmente el número de pendientes.
Faltan cotas locales y fotografías/levantamiento de cada tramo para cerrarlos
como réplica. Una escalera caminable estimada no constituye medición real.

## Validación y rendimiento

40 tests, sintaxis de módulos y diff; originales verificados por hash.
Recorrido guiado de 1,89 km completado hasta Ichinomine: llegada a 231,2 m
según la escena. Revisión visual de Yotsutsuji y las tres cumbres.
Auditoría de altura: 11.609 muestras, salto máximo 0,305 m y ninguno mayor
a 0,4 m. Colisiones: 2.318 muestras, ninguna bloqueada. El historial de consola
contiene mensajes de canal de listener cerrado durante una recarga; no se
atribuyen al renderer ni se afirma una consola histórica completamente limpia.
Comparación en checkpoint Yotsutsuji, cámara (801,41;165,95;-213,32),
1205 × 812, DPR 1, pestaña visible:

| Muestra | FPS | Envío CPU | Llamadas | Triángulos |
|---|---:|---:|---:|---:|
| R09 | 165 | 3,51 ms | 561 | 4.507.421 |
| R10 primera revisión | 164,3 | 3,50 ms | 567 | 4.507.369 |

Una muestra por revisión no demuestra rendimiento universal; la primera
comparación conserva aproximadamente la fluidez con copas de mayor cobertura.
No se abrió ninguna instancia adicional: un visor 3D y la referencia existente.
El descarte de geometría distante y la pausa al ocultar la pestaña se conservan.

Pendiente de fidelidad completa: levantamiento de los perfiles, distribución y
medidas particulares de todos los recintos secundarios, detalles constructivos
por edificio y validación fotogramétrica de vegetación. Esta revisión no cierra
la solicitud de una réplica exacta del predio entero.
