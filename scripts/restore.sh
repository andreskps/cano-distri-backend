#!/bin/sh
set -e

if [ -z "$1" ]; then
    echo "Uso: $0 <archivo_backup.sql.gz>"
    echo ""
    echo "Archivos de backup disponibles:"
    ls -la /backups/backup_*.sql.gz 2>/dev/null | tail -10 || echo "No hay backups disponibles"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: El archivo ${BACKUP_FILE} no existe"
    echo ""
    echo "Archivos disponibles:"
    ls -la /backups/backup_*.sql.gz 2>/dev/null || echo "No hay backups disponibles"
    exit 1
fi

echo "$(date): Iniciando restauración desde ${BACKUP_FILE}..."

# Mostrar información del backup
echo "Información del backup:"
ls -lh "${BACKUP_FILE}"
echo ""

# Confirmar antes de restaurar
echo "ADVERTENCIA: Esta operación sobrescribirá todos los datos existentes en la base de datos ${POSTGRES_DB}"
echo "¿Está seguro de que desea continuar? (escriba 'YES' para confirmar)"
read -r confirmation

if [ "$confirmation" != "YES" ]; then
    echo "Operación cancelada"
    exit 0
fi

echo "$(date): Procediendo con la restauración..."

# Descomprimir y restaurar
if gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h db \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  -v ON_ERROR_STOP=1 > /dev/null 2>&1; then
    
    echo "$(date): Restauración completada exitosamente"
else
    echo "$(date): ERROR - Fallo en la restauración"
    exit 1
fi
