# Chatbot de Koru — definición v1

## Objetivo

Nueva sección **Dashboard → Chatbot** para consultar datos estructurados de Koru, con respuestas factuales, en español, en tiempo real y siempre dentro del alcance autorizado del usuario.

## Alcance inicial

- Sólo **SUPERADMIN** durante desarrollo y v1.
- Preparado para habilitar progresivamente docentes, administradores y familias.
- Sólo lectura: sin crear, editar, eliminar, enviar ni ejecutar acciones.
- Consulta todos los dominios estructurados permitidos y su historial.
- No responde preguntas generales ajenas a Koru.

## Arquitectura

`Usuario → autenticación/RBAC → clasificación Jev → política de privacidad/permisos → herramientas de consulta autorizadas → resultado mínimo → modelo generativo → respuesta en streaming`

Reglas centrales:

- **Jev** sólo clasifica intención, dominio, entidades, ambigüedad y herramientas candidatas.
- El modelo generativo no consulta la base directamente ni recibe la base completa.
- Las herramientas son operaciones fijas y auditables; nunca SQL generado por IA.
- Autorización y alcance se verifican en servidor, en cada consulta.
- Cálculos, filtros y comparaciones se hacen de forma determinística en código/base de datos; el modelo sólo los explica.

## Modelos y privacidad

- Vercel AI Gateway.
- Modelo principal: **Gemini Flash** económico.
- Escalamiento invisible a un modelo Pro compatible cuando la complejidad lo justifique.
- Failover automático a un modelo de mayor calidad si el principal falla.
- Sólo proveedores en allowlist, sin entrenamiento con prompts y con **ZDR**.
- Se envían al modelo únicamente los resultados mínimos ya autorizados.
- Sin requisito de residencia regional; ZDR es suficiente.
- Si no hay proveedor compatible, falla de forma segura.

## Datos permitidos

Incluye datos estructurados autorizados: estudiantes, familias, grupos, docentes, evaluaciones, administración, finanzas, inventario, calendario, documentos y blog.

Reglas específicas:

- Blog, eventos y documentos: sólo publicados/autorizados.
- Documentos: sólo metadatos y enlace; nunca análisis del archivo.
- Blog: puede incluir contenido publicado.
- Eventos cancelados, datos archivados o eliminados lógicamente: sólo si se solicitan expresamente y con advertencia visible.
- Enlaces únicamente para documentos, blog y eventos; abren en nueva pestaña.
- No se incluyen enlaces a registros internos.

Exclusiones:

- CMS.
- Comunicaciones, mensajes, envíos de correo y sus métricas.
- Notas, observaciones, comentarios, justificaciones y cualquier texto interno libre.
- Credenciales, tokens, sesiones, secretos y contraseñas.
- Auditoría técnica, métricas de modelos y costos como tema de conversación.
- Donaciones.

## Privacidad

- Siempre se respeta el scope actual del usuario.
- Si no tiene autorización: “No tenés autorización para consultar esa información”.
- Datos sensibles: contacto, domicilio, salud y evaluaciones académicas.
- Para datos sensibles: solicitud explícita + permiso + una confirmación informada por sesión.
- La confirmación dura la sesión activa; expira al cerrar, recargar o tras 30 minutos sin actividad.
- Los nombres completos no requieren esa confirmación extra, pero siguen sujetos a permisos.
- Nunca se adivina información ni se responde con datos incompletos.

## Entradas y respuestas

- Acepta texto, archivos, imágenes y audio.
- Adjuntos: sólo sirven para expresar una consulta; jamás como fuente de la respuesta.
- Se descartan inmediatamente tras extraer la consulta.
- Puede aceptar otros idiomas, pero responde siempre en español.
- Respuestas concisas por defecto; el usuario puede pedir más detalle.
- Si hay más de 20 registros, entrega resumen y solicita filtro antes de listar individuales.
- Puede usar tablas o listas cuando ayuden.
- Streaming sólo después de obtener datos autorizados.
- Cancelación de respuesta disponible.

## Sesiones y auditoría

- Sesiones temporales: sin historial guardado.
- Contexto disponible sólo durante la sesión activa.
- Caduca tras 30 minutos de inactividad, cierre o recarga.
- Botón “Nueva conversación”.
- Auditoría mínima: usuario, fecha, herramientas, duración, modelo, costo y estado; nunca preguntas ni respuestas.
- Auditoría detallada: 90 días.
- Métricas agregadas anonimizadas: 12 meses.
- Vista técnica de auditoría: sólo SUPERADMIN.

## Formato regional

- Respuestas en español.
- Zona horaria: GMT-6.
- Fecha: `día/mes/año`.
- Hora: formato 24 horas.
- Importes: pesos mexicanos, por ejemplo `$1,234.56`.

## Costos

- Tope mensual inicial: **USD 20**.
- Alerta al 80%: **USD 16**.
- Bloqueo de nuevas consultas al llegar a USD 20.
- Reinicio el primer día de cada mes en GMT-6.
- Alertas en dashboard y por correo a todos los superadministradores.
- Sin exportaciones CSV/Excel en v1.

## Riesgos principales y mitigación

1. **Filtración entre roles** → autorización en servidor y herramientas con scope obligatorio.
2. **Alucinaciones** → respuestas sólo a partir de datos devueltos; cálculos determinísticos.
3. **Prompt injection** → adjuntos y mensajes tratados como entrada no confiable; nunca habilitan herramientas o permisos.
4. **Exposición de datos sensibles** → confirmación por sesión, minimización y exclusión de texto libre.
5. **Costo imprevisible** → modelos económicos, escalamiento controlado, presupuesto y alertas.
6. **Consultas lentas** → herramientas por dominio con filtros, límites y agregaciones.
7. **Resultados ambiguos** → el bot pide aclaración; nunca adivina.
8. **Cambios de permisos durante una sesión** → revalidación por consulta y cierre de sesión si cambia el acceso.

## Desarrollo recomendado

1. Inventario de dominios, campos permitidos y herramientas de consulta.
2. Matriz de permisos/scope por rol y dominio.
3. Capa de políticas, clasificación Jev y consultas determinísticas.
4. Integración de AI Gateway, streaming, costos y failover.
5. Interfaz Dashboard → Chatbot.
6. Auditoría mínima, alertas y pruebas de seguridad.
7. Corpus de preguntas reales por rol: permitidas, denegadas, ambiguas, incompletas y sensibles.
8. Lanzamiento sólo para SUPERADMIN; luego habilitación gradual por rol.

## Criterio de salida de v1

No se habilita para otros roles hasta comprobar, con casos de prueba reales, que:

- nunca muestra datos fuera de scope;
- no usa texto libre ni adjuntos como fuente;
- calcula correctamente;
- pide aclaración ante ambigüedad;
- controla presupuesto y fallos;
- mantiene privacidad en cada camino de error.
