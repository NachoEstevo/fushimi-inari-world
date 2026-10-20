# Prompt Mejorado — Producción Arquitectónica 3D: Fushimi Inari Taisha (Kioto)

Usá `$architectural-environment-production` para construir en **Blender 5.2 (Cycles GPU OptiX)** una recreación arquitectónica 3D coherente y multicapa del complejo sagrado **Fushimi Inari Taisha (伏見稲荷大社, Kioto)**, estructurada a lo largo de su eje procesional ascendente hacia el Monte Inari. Documentá en `scene-spec.json` qué dimensiones provienen de registros históricos/arquitectónicos del período Muromachi/Momoyama (Honden de 1499 y Rōmon de 1589) y cuáles son compresiones espaciales de emplazamiento para integrar las cuatro zonas icónicas en un recinto unificado de `96 m × 56 m`.

## Zonas Arquitectónicas y Assets Requeridos

1. **`Z01_Romon_Gate` (Puerta Rōmon de dos niveles, 1589):**
   - Estructura *Rōmon* de `3 × 2` vanos (`11.4 m × 6.6 m`, altura a cumbrera `12.8 m`) sobre podio de piedra (`H = 0.9 m`) con escalinata frontal.
   - Cubierta *Irimoya-zukuri* de fuerte curvatura cóncava con aleros soportados por complejos de ménsulas *tokyō* (*mitsuto* / *degumi*), barandilla perimetral en el piso superior (*kōran*), soga sagrada *shimenawa* en el vano central y placa caligráfica *hengaku*.
   - Flanqueada por dos estatuas guardianas de **Kitsune** sobre pedestales de granito tallado (izquierdo sosteniendo la llave del granero sagrado, derecho con la joya *hōju*) y linternas de piedra *ishi-dōrō*.
2. **`Z02_Gehaiden` (Salón de Culto Exterior / Ge-haiden):**
   - Pabellón abierto en el patio central (`10.2 m × 6.8 m`, altura `8.4 m`) con cubierta *Irimoya-zukuri*, columnas en bermellón *shu-iro* con basas de bronce negro, vigas talladas, campanas rituales *suzu* con cuerdas trenzadas *suzu-o* y linternas colgantes de bronce dorado (*tsuri-dōrō*).
3. **`Z03_Honden_Complex` (Terraza Superior: Nai-haiden, Honden *Inari-zukuri* de 1499 y Galerías *Kairō*):**
   - Conectado mediante escalinata axial de piedra (`Z = +2.4 m`).
   - **Nai-haiden** frontal con gablete ondulado *karahafū* y **Honden** principal (`13.6 m × 9.4 m`, altura `11.8 m`) de cinco vanos (*go-ken sha-nagare-zukuri*), faldón frontal extendido asimétrico, paneles de estuco blanco *shikku*, herrajes dorados *kanagu* en aleros y vigas, y alas de galería cubierta (*Kairō*) a norte y sur.
4. **`Z04_Senbon_Torii` (Senda Ascendente y Doble Galería de Senbon Torii hacia el Monte Inari):**
   - Desde la terraza noreste (`Z = +2.4 m` ascendiendo hasta `Z = +7.8 m`), avenida inicial de grandes **Myōjin Torii** (`H = 5.2 m`) que se bifurca mediante escalones de piedra y una plazoleta con linternas en los **dos túneles paralelos de Senbon Torii** (`H = 2.85 m`, paso denso de pórticos en bermellón *shu-iro* con basamentos negros *nemaki* e inscripciones negras laterales), rodeados de altares de piedra musgosa y bambú/cedros japoneses (*sugi*).

## Pipeline de Producción por Etapas (Stages 00 a 05)

- **Stage 00 — Fuente estructural (`scene-spec.json`):** Definir una especificación paramétrica única en metros (ejes, cotas de nivel, footprints, perfiles de cubierta, materiales PBR con densidad física `UVMap_Metric_1m`, poses de 6 cámaras físicas + cámaras cinematográficas y planos de sección A–A y B–B).
- **Stage 01 — Blueprint y Blockout CAD/BIM:** Construir los sólidos estructurales y derivar una **lámina técnica de 4 paneles** (`blueprints_4panel.png`, `.svg` y `.dxf` vía `ezdxf` + cortes reales en espacio mundo con `bmesh.ops.bisect_plane`):
  1. Planta de Recinto y Basamentos (`Z = +1.8 m`).
  2. Planta de Cubiertas y Galerías Superiores (`Z = +6.5 m`).
  3. Sección Longitudinal A–A (`Y = 0.0 m`, eje procesional Oeste-Este mostrando Rōmon, Ge-haiden, Honden y el ascenso de Senbon Torii).
  4. Sección Transversal B–B (`X = 16.0 m`, cortando el Honden, las galerías *Kairō* y el arranque de Senbon Torii) con hachurado técnico ANSI31, cotas métricas y niveles de referencia.
- **Stage 02 — Referencias Visuales y Texturas PBR:** Usar el subagente `image-generator` con la lámina de planos como guía estructural para generar una **hoja de contacto 16:9 en grilla 2×2 con 4 vistas fotorrealistas coherentes** (`Cam_01` Entrada Rōmon, `Cam_02` Patio Central Ge-haiden/Honden, `Cam_03` Túnel interior de Senbon Torii, `Cam_04` Vista aérea axonométrica del complejo) y mapas de textura PBR coherentes de 5 canales (Base Color, Roughness, Metallic, Normal, Height).
- **Stage 03 — Construcción Detallada y Gauntlet Multi-Agente:**
  - Modelar todos los activos arquitectónicos y modulares en Blender 5.2 (con geometría limpia, modificadores y colecciones separadas por zona, más exportación `.glb`/`.fbx` de assets modulares).
  - Renderizar vistas **Clay** (evaluación de silueta y estructura) y **Beauty** en 6 cámaras diagnósticas (`Cam_01` a `Cam_04`, `Cam_05_Overview` y `Cam_06_Section_AA` con corte BMesh real en espacio mundo).
  - Invocar **4 subagentes especialistas en paralelo** (`invoke_subagent`), uno por cada ángulo de referencia (`Cam_01` a `Cam_04`), pasando a cada uno el contrato `scene-spec.json`, la lámina de planos, la hoja de referencias 2×2 y los renders actuales para auditar proporciones, siluetas, uniones constructivas y materiales.
  - Como **Master Orchestrator**, reconciliar los hallazgos de los 4 críticos en una cola priorizada de tickets, aplicar las correcciones sobre los scripts constructores sin escrituras concurrentes, volver a renderizar y generar la **matriz comparativa Antes / Después** con cámaras fijas.
- **Stage 04 — Studio Polish (`visual-guidelines.md`):**
  1. **Luz con patrones (`Light_Gobo_Canopy`):** Dosel de follaje de cedro/bambú y gobo procedural proyectando sombras moteadas (*komorebi*) sobre los torii y escalinatas.
  2. **Micro-roughness y desgaste:** Mezcla `LINEAR_LIGHT` (`factor = 0.28`) de mapas de rugosidad con máscaras de `Pointiness` y Ambient Occlusion en bordes de madera lacada en bermellón *shu-iro*, musgo en basamentos de granito y pátina en bronce.
  3. **Cámaras físicas:** `sensor_fit = 'HORIZONTAL'`, `sensor_width = 36.0 mm`, `Focus_Target_<CamName>` con `f/2.8` en planos medios de Senbon Torii y `f/5.6` en vistas arquitectónicas amplias.
  4. **Compositor:** Nodos de Glare (`Fog Glow`, `threshold = 1.15`, `strength = 0.25`), dispersión cromática sutil (`0.008`) y curva tonal en S.
  5. **Atmósfera volumétrica:** `Global_Atmosphere_Volume_Box` con `Principled Volume` de baja densidad y `anisotropy = 0.70` para rayos de sol crepusculares atravesando las hileras de Senbon Torii.
- **Stage 05 — Entrega Completa:** Entregar `.blend` maestro editable, assets 3D modulares (`.glb`), scripts reproducibles de Blender/Python, `scene-spec.json`, planos técnicos (`.png`/`.svg`/`.dxf`), referencias 2×2, lámina de 6 vistas Clay/Beauty, corte 3D A–A, matriz Antes/Después y reporte de verificación.
