# Primera integración: acceso y Rōmon

Abrir `http://127.0.0.1:8420/integration-demo/index.html` con el servidor existente,
o ejecutar `../iniciar_demo_integracion.bat`.

La demo consume el mismo `geography/terrain.json`, `features.json` y `geo-core.mjs`
del visor geográfico. No modifica esas fuentes. Incluye la red de caminos y las
huellas de edificios como contexto; las alturas sin metadatos son aproximadas.
Los volúmenes contextuales que intersectan la zona del acceso se omiten para
evitar duplicar el modelo. No son reconstrucciones terminadas.

`../scripts/export_romon_demo.py` abre el master original en memoria y exporta
solamente Z01, T00, muros de contención y escalinata Rōmon. Conserva los metros,
geometría, UV y materiales; agrupa objetos por material para reducir draw calls.
No guarda cambios en el master. El GLB derivado tiene 15 lotes de material.
Las texturas PBR se cargan de los archivos existentes en assets/textures/nanobanana.

`placement.json` registra el anclaje OSM, giro aproximado y escala 1:1. El datum
se obtiene del DEM GSI en el Rōmon menos los 1,6 m de terraza del modelo previo.
La demo adapta reversiblemente el terreno alrededor del acceso y añade una
continuación corta del piso superior. Este ajuste es inferido: no representa
un levantamiento de terrazas ni valida las dimensiones del modelo anterior.
Las posiciones relativas del torii, faroles y galerías siguen siendo las previas.

Controles: cuatro cámaras, órbita y zoom. No se incluye todavía navegación a pie
con colisiones, vegetación del recinto completo, resto de pabellones ni Senbon.
El enlace de la interfaz permite volver a la experiencia anterior intacta.
No se han generado imágenes nuevas: esta revisión debe evaluar reutilización
arquitectónica y encaje geográfico antes de avanzar en dirección de arte.

Comprobaciones: exportación Blender, sintaxis JavaScript y 9 pruebas geográficas.
Revisión visual en navegador de las cuatro cámaras. La verificación histórica,
las dimensiones mediante relevamiento y el rendimiento móvil quedan pendientes.
