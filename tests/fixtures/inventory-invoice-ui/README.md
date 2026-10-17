# Pruebas de ingreso de inventario

Las pruebas de integración ejecutan los handlers públicos del componente con hooks y APIs del navegador simuladas. No requieren credenciales, OpenAI, una base de datos ni una cámara física.

El ingreso permite **Tomar foto**, **Subir archivo** (JPEG, PNG, WebP, PDF, XLSX, XLS o CSV; máximo 4 MB finales) o **Carga manual**. Las fotos se convierten a JPEG y se reducen antes de validar ese límite (máximo 20 MB originales). HEIC requiere que el navegador pueda decodificarlo; si no, se indica usar JPEG/PNG. La cámara necesita HTTPS y permiso; ofrece captura nativa y selector de archivos como alternativas.

En los tres modos se ingresan manualmente **Proveedor** y **Fecha del ingreso**. La fecha empieza vacía y debe ser una fecha real. La interpretación no completa ninguno de esos campos. Revisar y confirmar es obligatorio antes de modificar stock; la carga manual no llama al análisis ni a OpenAI. Una confirmación incierta conserva el mismo contenido y UUID para reintentar, incluso si se cierra y abre el diálogo. No se debe recargar la página mientras está pendiente.
