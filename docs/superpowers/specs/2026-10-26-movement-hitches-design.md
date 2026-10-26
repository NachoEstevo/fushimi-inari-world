# Diagnóstico de tirones al caminar y girar

Diseño aprobado por el usuario el 26 de octubre: «Ok. Probemos».

Objetivo: atribuir frames lentos a trabajo concreto con el flujo normal activo, preservando calidad cercana y el checkout compartido. El banco de sombras previo bloqueaba walkingPrewarm; no se usará para descartar costes del flujo real.

Capturar desde el visor existente para evitar otra escena en la GPU. Comparar caminata y giro de ida y vuelta, primera exposición y repetición caliente. Conservar perfiles de CPU y trazas de tareas, compilación, GC y actividad gráfica. Las mediciones instrumentadas sirven para atribución; no se presentarán como FPS sin sobrecarga.

Confirmar el candidato principal con una ablación reversible y aislada, si los controles existentes la permiten. Si requiere código nuevo, mantenerlo optativo y probar la ruta normal. Comparación WebGL de compatibilidad solo si aporta a una hipótesis concreta. No equivale al renderer WebGL histórico.

Éxito: reproducción documentada, frames costosos con stacks asociados y prueba que confirme o descarte una causa. Si no se reproduce, informar límites y conservar datos; no prometer solución ni atribuir latencia GPU a tiempo de envío CPU. Ningún efecto visual se reduce permanentemente.
