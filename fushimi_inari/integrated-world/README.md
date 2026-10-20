# Integrated world · revision 14

Latest changes, evidence and limitations: [REFERENCES-R14.md](REFERENCES-R14.md).

Open `http://127.0.0.1:8420/integrated-world/index.html` or run
`../iniciar_experiencia_3d.bat`. Previous scenes remain available and unchanged.

## Controls

- **Esc:** pause and open Movement, Checkpoints, Routes or Environment.
- **Walk:** WASD/arrows, drag to look, Shift to boost, E to interact.
- **Free flight:** WASD follows the viewing direction; R/Space ascends,
  F/Ctrl descends. Flight speed is separate from walking speed. No ground snap.
- **Orbit view:** drag to orbit and scroll to zoom around a target.
- **Checkpoints:** 22 destinations and ten quick buttons, entering walking mode.
- **Routes:** mapped ascent, return loop, custom stops and Senbon branches.
- **Environment:** sound, volume, birds, breeze, chimes and lighting.

The menus and interaction summaries are in English. Original scene content is
retained in the source builders. Historical notes below document earlier work.

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

