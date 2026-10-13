-- ---------------------------------------------------------------------------
-- Meta 3.2 - REST API: Perfiles de Jugadores y Rosters
-- Creación de la base de datos y del usuario de la aplicación.
--
-- Uso (PowerShell):
--   mysql -u root -p < db/setup.sql
--
-- Ejecutar UNA sola vez. Es idempotente: si el usuario o la base ya existen,
-- MySQL solo emite un aviso y continúa.
-- ---------------------------------------------------------------------------

-- 1. Base de datos
CREATE DATABASE IF NOT EXISTS `esports`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Usuario dedicado a esta aplicación (principio de mínimo privilegio:
--    solo accede a la base `esports`, no a todo el servidor)
CREATE USER IF NOT EXISTS 'esports_user'@'localhost'
  IDENTIFIED BY 'esports_pass';

CREATE USER IF NOT EXISTS 'esports_user'@'127.0.0.1'
  IDENTIFIED BY 'esports_pass';

-- 3. Privilegios sobre esa base
GRANT ALL PRIVILEGES ON `esports`.* TO 'esports_user'@'localhost';
GRANT ALL PRIVILEGES ON `esports`.* TO 'esports_user'@'127.0.0.1';

-- 4. Aplicar cambios
FLUSH PRIVILEGES;

-- Verificación: debería poder conectarse sin errores
--   mysql -u esports_user -p esports