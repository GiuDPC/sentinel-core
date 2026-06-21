import './docs/extendZod.js'; // IMPORTANT: Must be FIRST import to hack Zod prototypes
import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
    console.log(`Sentinel-core corriendo en http://localhost:${env.PORT}`);
    console.log(`Entorno: ${env.NODE_ENV}`);
})