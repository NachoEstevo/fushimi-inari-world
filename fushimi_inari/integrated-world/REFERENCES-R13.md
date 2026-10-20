# Revisión 13 — interfaz y revisión completa de perfiles pendientes

## Interfaz

Título de ubicación según el anclaje más próximo; fuera de 45 m se indica
"Sendero" y el lugar de referencia. Es orientación aproximada, no geocerca
topográfica. Pantalla de exploración con minimapa y botón Menú · Esc.
Paneles blancos translúcidos, menos texto y sin estadísticas técnicas visibles.
Se conservan las atribuciones cartográficas.

Esc abre un diálogo modal accesible con velocidad, teletransporte y sonido.
Ambiente y planificación se despliegan a petición. Conserva itinerarios,
ramales, perfil, iluminación, vista general y controles originales.
Abrir el menú detiene las teclas y la rotación de la cámara; cerrar reanuda
la caminata. Un recorrido guiado se pausa y se retoma desde Continuar.

## Los 54 perfiles se revisaron; no todos pueden certificarse

`profile-audit-r13.json` registra individualmente los 54 casos de R12,
su estado y las medidas faltantes. `stair-review.json` conserva los 52
casos que todavía necesitan verificación dimensional.

Se repararon dos conflictos artificiales: `way/439990448` (15 escalones)
y `way/1276691447` (7). Antes, cada muestra de terreno a 5 m forzaba un
tramo con cantidad entera de escalones y podía rechazar un total válido.
Ahora se conservan los vértices originales y los máximos/mínimos intermedios;
los puntos de muestreo monótonos no fuerzan nuevos tramos. Las alturas entre
esos puntos se interpolan como estimación, no como medición de peldaños.
La regresión real de Yotsutsuji conserva sus conteos 10, 25 y 60.

Los 52 restantes pasan las comprobaciones registradas de contrahuella <=24 cm
y huella >=18 cm. Eso no certifica la forma real: 43 tienen extremos casi
planos en el DEM y cinco están afectados por nivelación local (categorías
superpuestas). No se inventaron desniveles para convertirlos en "resueltos".
Faltan cotas de descansos, conteos verificados y empalmes con las terrazas.

## Validación

46 pruebas pasan, incluyendo los dos caminos reales recuperados, máximos
intermedios, curvas, conectividad y colisiones. Revisión de sintaxis y diff.
En navegador: Esc abre/cierra, W no desplaza durante el menú, caminar se
reanuda, cambio de velocidad persiste, sonido cambia encendido/apagado,
teletransporte actualiza el título y conserva la posición al abrir ajustes.
Los HTML originales mantienen sus hashes. No se abrieron nuevas instancias.

La versión móvil está adaptada por CSS, pero no se realizó una prueba en
dispositivo físico. La interfaz nueva no cambia las limitaciones dimensionales
de la reconstrucción ni equivale a una réplica completa del predio.
