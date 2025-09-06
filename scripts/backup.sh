#!/bin/sh
set -e

# Configuración
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${POSTGRES_DB}_${DATE}.sql"

# Crear directorio si no existe
mkdir -p "${BACKUP_DIR}"

echo "$(date): Iniciando backup de la base de datos ${POSTGRES_DB}..."

# Crear backup
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h db \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --verbose \
  --clean \
  --no-owner \
  --no-privileges \
  > "${BACKUP_FILE}" 2>/dev/null

if [ $? -eq 0 ]; then
    # Comprimir backup
    gzip "${BACKUP_FILE}"
    echo "$(date): Backup completado: ${BACKUP_FILE}.gz"
    
    # Mostrar tamaño del archivo
    ls -lh "${BACKUP_FILE}.gz"
    
    # Limpiar backups antiguos
    if [ -n "${BACKUP_KEEP_DAYS}" ] && [ "${BACKUP_KEEP_DAYS}" -gt 0 ]; then
        echo "$(date): Limpiando backups antiguos (más de ${BACKUP_KEEP_DAYS} días)..."
        find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f -mtime +${BACKUP_KEEP_DAYS} -delete
        echo "$(date): Limpieza completada"
    fi
    
    echo "$(date): Proceso de backup finalizado exitosamente"
else
    echo "$(date): ERROR - Fallo en el backup de la base de datos"
    exit 1
fi
