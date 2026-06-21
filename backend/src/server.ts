import './docs/extendZod.js'; // IMPORTANT: Must be FIRST import to hack Zod prototypes
import app from './app.js';
import { env } from './config/env.js';
import { notificationService } from './services/notification.service.js';

app.listen(env.PORT, () => {
    console.log(`Sentinel-core corriendo en http://localhost:${env.PORT}`);
    console.log(`Entorno: ${env.NODE_ENV}`);

    // M5: Limpieza de notificaciones viejas al arrancar (no bloquea el startup)
    notificationService.cleanOldNotifications()
        .then((count) => { if (count > 0) console.log(`[Cleanup] ${count} notificaciones antiguas eliminadas`); })
        .catch((err) => console.error('[Cleanup] Error limpiando notificaciones:', err));
})