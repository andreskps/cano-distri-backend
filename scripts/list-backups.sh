#!/bin/sh
set -e

echo "=== Lista de Backups Disponibles ==="
echo ""

BACKUP_DIR="/backups"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Directorio de backups no encontrado: $BACKUP_DIR"
    exit 1
fi

# Mostrar todos los backups
backups=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | sort -r)

if [ -z "$backups" ]; then
    echo "No se encontraron archivos de backup en $BACKUP_DIR"
    exit 0
fi

echo "Archivos de backup encontrados:"
echo ""

count=0
for backup in $backups; do
    count=$((count + 1))
    filename=$(basename "$backup")
    size=$(ls -lh "$backup" | awk '{print $5}')
    date_created=$(ls -l "$backup" | awk '{print $6, $7, $8}')
    
    echo "$count. $filename"
    echo "   Tamaño: $size"
    echo "   Creado: $date_created"
    echo ""
done

echo "Total de backups: $count"
echo ""
echo "Para restaurar un backup, use:"
echo "docker-compose exec backup sh /scripts/restore.sh /backups/<nombre_del_archivo>"
