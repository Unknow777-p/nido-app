# Nido Android (nativo, Kotlin)

Módulo nativo que se instala en la tablet del niño y **sí bloquea de verdad**:

- Sincroniza con tu servidor Nido (`/api/rpc/*`): `pairDevice`, `deviceHeartbeat`, `deviceClassify`, `deviceReportTamper`.
- Usa `AccessibilityService` para:
  - Enviar al inicio apps bloqueadas (según tus interruptores del panel web).
  - Detectar la URL en navegadores (Chrome, etc.) y bloquearla vía `deviceClassify`.
  - Mostrar pantalla de bloqueo cuando el tiempo se acabó (`child.locked`).

## Abrirlo

1. Abre **Android Studio** → File → Open → carpeta `nido-android`.
2. Espera a que sincronice Gradle (descarga el SDK si falta).
3. Conecta una tablet/emulador y pulsa Run.

## Configurar

En la tablet, la app pide:

- **Servidor**: la URL de tu API Node. Si la tablet está en la misma Wi-Fi que tu PC:
  `http://<IP-de-tu-PC>:3002` (puerto del `nido-app`). Averigua tu IP con `ipconfig`.
- **Código**: el que generas en el panel web del tutor (`Perfil → Código de vinculación`).

Luego activa el bloqueo: botón "Activar bloqueo" → busca **Nido** en servicios de accesibilidad y actívalo.

## Limitaciones honestas

- El escaneo de URL depende de lo que el navegador exponga en la vista de accesibilidad; puede variar por navegador/versión.
- Android puede desactivar el servicio tras reinicios o si el usuario lo desactiva: conviene marcar la app como "sin optimización de batería".
- Para desinstalar la app de Nido sin que el niño la quite, se necesita un `DevicePolicyManager` (modo kiosko/padre), que es un paso extra que podemos agregar después.
