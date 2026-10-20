# Mundo integrado · revisión 03

Abrir `http://127.0.0.1:8420/integrated-world/index.html` o ejecutar
`../iniciar_experiencia_3d.bat`. La demo inicial y ambas experiencias anteriores
siguen disponibles en sus ubicaciones originales.

## Recorrido

- **Visitar sector integrado:** 22 accesos a los pabellones y sectores trasladados.
- **Caminar:** WASD/flechas, arrastrar para mirar, Shift para correr, E para
  interactuar y Esc para salir. No depende de Pointer Lock, que el navegador
  integrado rechazó durante la prueba.
- **Recorrer:** avance guiado sobre la red OSM, con pausa y velocidad seleccionable.
- **Túnel de Senbon:** elegir cualquiera de las dos vías cartografiadas.
- **Circuito:** ascenso y regreso por Mitsurugi/Gozendani, aproximadamente 3,9 km.
  También permite origen, destino y parada intermedia a elección.
- Luz de día/atardecer/noche, audio opcional, mapa y perfil de elevaciones.

## Qué se conserva

La extracción reutiliza los constructores originales del visor: 1.858 mallas
procedurales, tipos de vegetación, faroles, altares Otsuka, santuarios de las
cumbres, casas de té, kitsune, carteles, tablillas, cuerdas, velas y objetos
interactivos. También conserva su síntesis de audio y parpadeo de velas.

Los GLB del Rōmon, Gehaiden, Naihaiden y Honden se derivan del master sin
guardarlo. Mantienen geometría, UV, materiales y dimensiones. Naihaiden incluye
sus escaleras y faroles; Honden conserva Tamagaki. Los edificios se trasladan
individualmente: la separación comprimida anterior no se estira con los modelos.

Las mallas estáticas se agrupan por material después de colocarlas. Los
interactuables conservan identidad y callbacks. Los torii de Senbon se
reinstancian en ambas polilíneas reales usando el conteo OSM de 2014 (781).
No se afirma que su cantidad actual o posición individual estén verificadas.

Se sustituyen el terreno y los caminos comprimidos, y el skyline ilustrativo
anterior, por los datos geográficos existentes. Los volúmenes OSM aproximados se
pueden activar como contexto. Se amplía el bosque con los mismos modelos sugi,
semilla fija 20261020 y exclusión de caminos, edificios, agua y explanadas.
La distribución de esos árboles es ilustrativa, no un censo geográfico.

## Geografía y límites de fidelidad

`anchors.json` declara los anclajes y las posiciones fuente. OSM aporta las
ubicaciones y conexiones; GSI aporta la elevación base, sin exageración vertical.
La altura de cámara, las calzadas y el relieve comparten la función de terreno.
Las pequeñas terrazas tienen adaptación local y transición al DEM. Las superficies
de piedra y escalones originales se consultan adicionalmente al caminar.

Los edificios principales se anclan a identificadores OSM. Las casas de té usan
centros de huellas OSM; su correspondencia con cada modelo previo es interpretativa.
Orientación de accesos, distribución interna, elementos menores, vegetación,
materiales y textos históricos heredados todavía requieren contraste documental
y visual. Los carteles del modelo anterior no constituyen autoridad cartográfica.
El DEM de 10 m no mide individualmente escalones, muros o pequeñas plataformas.

No se afirma una réplica pixel perfect ni un relevamiento histórico terminado.
La validación de movilidad completa en dispositivos móviles queda pendiente;
el recorrido guiado sirve como alternativa a WASD.

## Construcción y comprobación

1. `scripts/extract_legacy_builders.py`: genera el adaptador de geometría,
   interacciones y colisiones a partir del HTML original, sin editarlo.
2. Blender en segundo plano con `scripts/export_integrated_architecture.py`:
   genera cuatro GLB independientes.
3. `scripts/build_integrated_viewer.py`: adapta el explorador geográfico y
   reutiliza la síntesis de audio original.
4. `node --test geography/geo-core.test.mjs integrated-world/spatial.test.mjs integrated-world/collision.test.mjs`
   desde `fushimi_inari`: 22 pruebas de terreno, conectividad, bifurcaciones,
   escala rígida, preservación de fuente y colisiones.

Los ajustes de colisión corrigen la convención de rotación Y y dejan libre la
aproximación frontal de las cumbres. Los carteles y faroles se separan de los
caminos reales; los dos túneles usan columnas con colisión y paso central libre.
La auditoría de obstáculos de los recorridos se expone en `data-collision-audit`
del documento para repetir la revisión. No sustituye una inspección de todos los
caminos secundarios ni una comprobación de cada triángulo del modelo.

Los archivos HTML originales conservan sus SHA256:

```text
index.html: 01c75ca7d76ef0b44b75f34f856b3e6b66c80845a55a3faa092c0c2bfb79dcc9
interactive_viewer/index.html: 7df3663bd36b00554ac654a7f663a91f0d1ba9c753ed743dd11aea0796b05821
```


## Revisión 03

Ver REFERENCES-R03.md para fuentes consultadas, Street View, dimensiones, reutilización y pendientes. Incluye escaleras OSM, pavimentos por superficie, bosque más denso y torii por tramos. Agregar integrated-world/route-spec.test.mjs al comando de pruebas.

