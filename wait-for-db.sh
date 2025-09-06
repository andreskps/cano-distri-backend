#!/bin/sh
set -e

echo "Esperando a que la base de datos esté lista..."

# Esperar hasta que PostgreSQL esté disponible
until pg_isready -h db -p 5432 -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"; do
  echo "Base de datos no está lista - esperando..."
  sleep 2
done

echo "Base de datos está lista - iniciando aplicación..."
exec node dist/main.js
