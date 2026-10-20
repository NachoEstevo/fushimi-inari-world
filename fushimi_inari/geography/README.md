# Inariyama — base geográfica 1:1

Entrega de terreno, red de caminos y huellas cartográficas. Esta es la base espacial para reconstruir el mundo; no es todavía la réplica arquitectónica terminada.

## Abrir y recorrer

Usar `../iniciar_experiencia_3d.bat`, que ahora abre `http://127.0.0.1:8420/geography/index.html`. Requiere Python disponible como `python.exe`. El servidor queda limitado a localhost. El visor utiliza la misma versión de Three.js por CDN que el proyecto anterior.

- Vista general: orbitar, acercar y leer el relieve con curvas cada 10 m.
- Ascenso: Rōmon → Senbon → Okusha → Kumataka → Yotsutsuji → Sannomine → Ninomine → Ichinomine.
- Circuito: continúa por Mitsurugisha y Gozendani y retorna por Yotsutsuji a Rōmon.
- Personalizado: elegir origen, destino y un hito intermedio para recorrer otro ramal.
- Recorrer/Pausar: cámara a 1,70 m sobre la superficie, a 1,4 m/s o avance acelerado explícito.
- El minimapa y el perfil usan las mismas coordenadas del mundo. Clic en un punto del mapa selecciona destino.
- El enlace «Escena anterior» conserva acceso al trabajo visual previo.

Los itinerarios unen hitos mediante caminos cartografiados. No son una certificación de acceso público actual ni una captura exacta de todas las señalizaciones del santuario.

## Cobertura y procedencia

| Dato | Implementación |
| --- | --- |
| Extensión | 2.560 × 2.460 metros; incluye el monte y alrededores urbanos |
| Límite | Rectángulo de estudio, **no** deslinde legal de Fushimi Inari |
| Terreno | 63.479 muestras, malla de 10 m, elevaciones GSI DEM10B |
| Rango de altitud | 22,11–237,57 m s.n.m. en toda la extensión |
| Caminos/calles | 1.807 ways OSM, con nodos originales y etiquetas conservadas |
| Edificios | 9.835 huellas OSM; extrusión aproximada cuando falta `height` |
| Agua | 109 elementos de agua/cursos; sólo polígonos de agua se muestran como superficies |
| Puntos | 506 elementos candidatos; 114 hitos con nombre expuestos en el visor |
| Ejes | Web: X este, Y altitud, Z sur. Blender: `[x, -z, y]` |
| Escala | 1 unidad = 1 metro, sin exageración vertical ni compresión del recorrido |

La proyección local usa radio WGS84 6.378.137 m y coseno de la latitud de origen. Es una aproximación métrica local para una extensión de pocos kilómetros, no un levantamiento topográfico certificado. El origen es un punto de referencia de coordenadas, no un monumento medido. El plano de apoyo conserva la elevación GSI; no se aplica un offset inventado para forzar 233 m.

Fuentes:

- [OpenStreetMap y licencia ODbL](https://www.openstreetmap.org/copyright): caminos, huellas, nombres y puntos.
- [Especificación de elevaciones GSI](https://maps.gsi.go.jp/development/demtile.html): tiles de altitud `dem`, zoom 14.
- [Mapa oficial del santuario](https://inari.jp/trip/map01/): contraste de nombres y secuencia de hitos.
- [Inariyama oficial](https://inari.jp/en/map/spot_01/): cumbre de 233 m; el modelo de elevación da aproximadamente 231 m en el hito cartográfico.

`manifest.json` registra extensión, transformaciones, fecha de construcción, timestamp de OSM, URLs y hashes SHA-256. `sources/` guarda las respuestas originales y las consultas. Las imágenes de Google Maps no se usaron como cartografía extraída ni como texturas.

## Una fuente espacial compartida

- `terrain.json`: rejilla de elevaciones.
- `features.json`: geometrías, IDs OSM, etiquetas, coordenadas y longitudes de origen.
- `manifest.json`: contrato espacial y procedencia.
- `geo-core.mjs`: interpolación sobre los triángulos del terreno, grafo, acceso, búsqueda de ruta, muestreo y métricas.
- `viewer.mjs`: presentación del mundo, mapa y recorrido.
- `fushimi_geography.blend`: blockout Blender derivado de los mismos JSON; no modifica el master anterior.

El terreno base se remuestrea desde GSI. Para dibujar los caminos y situar la cámara se interpola **el triángulo real de la malla**, evitando discrepancias entre una interpolación bilineal y la superficie visible.

Las rutas sólo se conectan por IDs de nodos OSM compartidos. No se crean atajos entre líneas cercanas o cruzadas. Se respetan `foot`, `access` y `oneway:foot`; el sentido único de vehículos no se aplica automáticamente al peatón. Las rutas privadas/prohibidas, autopistas, obras y polígonos `area=yes` no se usan para caminar. Puentes y túneles se excluyen del recorrido a ras del suelo hasta modelar su nivel separado.

Los hitos se asocian al nodo elegible más cercano hasta 80 m. En el circuito predefinido la separación máxima es aproximadamente 12 m. Se informa esa separación: la cámara recorre el camino y no inventa un acceso hasta el interior del edificio.

## Verificación

Comandos reproducibles desde la raíz del proyecto:

```powershell
python fushimi_inari/scripts/build_geography.py --offline
node --test fushimi_inari/geography/geo-core.test.mjs
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python fushimi_inari/scripts/build_geography_blender.py
```

- Generación desde caché completada sin consultar proveedores.
- Nueve pruebas: interpolación y diagonal de la malla, posición y altitud de la cumbre, conexión Rōmon–cumbre, ramal alternativo, componentes desconectados, restricciones, muestreo sobre el terreno, cierre del circuito y cruces sin conexión.
- Ruta corta Rōmon–cumbre: aproximadamente 1,65 km. No equivale al itinerario con todos los hitos.
- Ascenso por los hitos: aproximadamente 1,89 km; +219/-30 m sobre DEM.
- Circuito completo: aproximadamente 3,91 km; +261/-261 m sobre DEM.
- Verificación visual del visor, origen/destino y ramal personalizado, perfil, minimapa, pausa y retorno a vista general. Se completó el ascenso hasta la cumbre y el circuito completo de regreso a Rōmon en avance acelerado; las llegadas mostraron aproximadamente 231,2 y 41,9 m s.n.m.
- Cuatro renders Blender revisados: perspectiva general, planta norte, ladera este y lectura desde el santuario hacia la cumbre. La primera revisión detectó encuadres que recortaban la extensión; se ampliaron.
- Se reabrió `fushimi_geography.blend` en Blender 5.2 y se comprobaron escala métrica, 63.479 vértices del terreno y manifest embebido.

Los desniveles acumulados dependen del muestreo del DEM y no sustituyen una medición in situ.

## Pendientes para la siguiente etapa

1. Levantamiento de escalones, terrazas y muros: DEM10B no los resuelve. No se inventaron escaleras a partir de ruido de altura.
2. Revisar conexiones finas y accesos con referencias de campo/Street View. Hay vías aisladas y 369 ways que cruzan el borde del estudio omitidos enteros; no se cortaron ni conectaron ficticiamente.
3. Ensamblar relaciones OSM complejas; los elementos representados únicamente como relaciones pueden faltar.
4. Validar cada santuario y abrir pasajes en su geometría: los actuales prismas son huellas extruidas, no edificios navegables. El recorrido geográfico puede atravesar un volumen provisional donde el edificio real tiene un pasaje.
5. Integrar los modelos arquitectónicos existentes **por anclas geográficas y orientación verificadas**, sin estirar globalmente el mundo anterior.
6. Verificar detalles/ausencias de OSM y duplicados node/way de un mismo lugar. Los nombres comunes pueden repetirse legítimamente.
7. Añadir vegetación, torii individuales, materiales e iluminación sólo tras aprobar estas relaciones espaciales.
8. Verificación móvil y de rendimiento extensa pendiente.

Se preservaron los dos HTML anteriores, el `scene-spec.json` interpretativo y el master Blender. El único archivo existente cambiado es el lanzador; su copia anterior está en `outputs/geography-baseline/iniciar_experiencia_3d.original.bat`.
