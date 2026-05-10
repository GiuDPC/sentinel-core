# Contexto de Migración: Sentinel Core a Desktop (Tauri + SQLite)

**Para el Modelo de IA / Asistente que lea este documento:**
Este proyecto es una copia experimental de "Sentinel Core", originalmente una aplicación web (React/Vite + Node.js/Express + Prisma + PostgreSQL). El objetivo de esta rama experimental es convertir el sistema en una **aplicación de escritorio nativa, portable y offline** utilizando **Tauri** y **GitHub Actions** para la compilación cruzada.

A continuación se detalla el estado actual, la arquitectura y el problema principal que debe resolverse.

## 🏗️ Estado Actual de la Arquitectura
- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Lucide React. Totalmente funcional y pulido con una estética corporativa "premium".
- **Backend:** Node.js, Express. Expone una API REST consumida por el frontend de React.
- **Base de Datos:** PostgreSQL.
- **ORM:** Prisma (`provider = "postgresql"`).
- **Autenticación:** JWT vía Cookies (`credentials: 'include'`).

## 🛑 El Gran Problema: PostgreSQL vs Tauri
Actualmente, el sistema depende de PostgreSQL, que es un motor de base de datos pesado basado en servicios de servidor. Tauri está diseñado para crear aplicaciones de escritorio ligeras y portables (offline). 

Intentar empaquetar un servidor de base de datos PostgreSQL entero dentro de un ejecutable de Tauri para que corra en cualquier PC (Windows patata, Mac, Linux) sin requerir que el usuario final instale software adicional es inviable y rompe el propósito de la portabilidad.

## 🎯 Objetivo Experimental a Desarrollar
Necesito que me ayudes a realizar los siguientes cambios en esta copia del código:

### 1. Migración de Base de Datos (PostgreSQL -> SQLite)
Dado que es una app offline de escritorio, necesitamos cambiar el motor de base de datos a **SQLite**, que funciona con un simple archivo local (`.db`) y no requiere instalaciones de terceros.
- **Prisma Schema:** Cambiar el `provider` a `"sqlite"`.
- **Tipos Incompatibles:** Adaptar el esquema de Prisma actual eliminando/modificando cosas exclusivas de Postgres (como `@db.VarChar`, tipos `JSON` si hay, o Enums nativos de base de datos que SQLite no soporta nativamente en Prisma).
- **Almacenamiento Local:** Asegurar que el archivo de SQLite se guarde en una ruta segura del sistema operativo (AppData / LocalApplicationData) para que no se borre al actualizar el `.exe` de Tauri.

### 2. Sidecar Pattern (Node.js en Tauri)
El frontend de React será empaquetado nativamente por Tauri (Rust), pero tenemos un backend entero en Node.js que procesa la lógica pesada y usa Prisma.
- Hay que compilar el backend de Node.js a un ejecutable usando herramientas como `pkg` o esbuild + nexe, o usar el patrón **Sidecar de Tauri** para inicializar el backend de Express automáticamente cuando la app de Tauri arranque.
- El frontend debe apuntar dinámicamente al puerto donde el sidecar de Node levante el servidor.

### 3. GitHub Actions para Compilación Cruzada
Tauri soporta la compilación automática para Windows, macOS y Linux mediante GitHub Actions.
- Necesitamos crear un workflow (`.github/workflows/build.yml`) que ejecute el empaquetado del sidecar de Node, construya el frontend de Vite, y finalmente compile el binario de Tauri.
- El resultado deben ser los archivos `.exe` (Windows), `.dmg` (Mac) y `.AppImage`/`.deb` (Linux) listos en los "Releases" del repo de GitHub.

### 4. Módulo de Backups
En PostgreSQL usábamos comandos de sistema (`pg_dump` y `psql`) a través de un `child_process`.
Con la migración a SQLite, **esto se vuelve ridículamente fácil**. Un backup en SQLite es literalmente copiar el archivo `database.db` a otra carpeta (usando `fs.copyFileSync`). Necesitamos refactorizar el `backup.service.ts` para que aproveche esto, eliminando la dependencia de comandos de consola.

---
**Instrucciones para la IA:**
Lee este contexto y formula un plan paso a paso. Comienza atacando primero la refactorización de `prisma.schema` para SQLite, ya que es el núcleo estructural del cambio. Luego procederemos con el empaquetado del Sidecar y finalmente la integración con Tauri.
