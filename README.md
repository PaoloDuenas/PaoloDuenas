# Paolo Dueñas · Paolin++

Desarrollo software para despachos contables en México. En Paccioli trabajo con el recorrido de una factura electrónica: recuperar el XML del SAT, identificar a qué contribuyente pertenece y hacer que un contador pueda encontrarla por RFC, nombre, folio o UUID.

Una búsqueda parece sencilla hasta que una persona administra varios RFC. La lista de facturas, el total que aparece en pantalla y el XML que se puede descargar tienen que respetar los mismos permisos. Otro problema que me toca resolver es qué pasa cuando una sincronización se interrumpe: al retomarla, una factura que ya llegó debe aparecer una sola vez.

## Código público

- [Greenhome](https://github.com/PaoloDuenas/Backend-Greenhome) guarda lecturas de sensores por maceta. Cada registro asocia la humedad del suelo y la temperatura ambiente con la planta y el momento de la medición.
- [Pruebas de compra con Cypress](https://github.com/PaoloDuenas/e2e-ecommerce-automation) recorre una compra en Sauce Demo, desde el inicio de sesión hasta el checkout. Los escenarios y sus datos de prueba se pueden leer por separado.

[Instagram](https://instagram.com/paolo_duenas) · [Twitter](https://twitter.com/paoloduenas)