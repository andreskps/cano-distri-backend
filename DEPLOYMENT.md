# Cano Distribuciones Backend - Despliegue

## 📋 Pre-requisitos

- VPS con Ubuntu 20.04+ o similar
- Docker y Docker Compose instalados
- Dominio configurado apuntando a tu VPS
- Nginx Proxy Manager configurado

## 🚀 Instalación en VPS

### 1. Preparar el servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sesión
exit
```

### 2. Instalar Nginx Proxy Manager

```bash
# Crear red para NPM
docker network create nginx-proxy-manager

# Crear directorio para NPM
mkdir -p ~/nginx-proxy-manager && cd ~/nginx-proxy-manager

# Crear docker-compose para NPM
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - nginx_data:/data
      - nginx_letsencrypt:/etc/letsencrypt
    networks:
      - nginx-proxy-manager

volumes:
  nginx_data:
  nginx_letsencrypt:

networks:
  nginx-proxy-manager:
    external: true
EOF

# Levantar NPM
docker-compose up -d
```

### 3. Subir y configurar la aplicación

```bash
# Clonar repositorio
git clone <tu-repositorio> ~/cano-distri-backend
cd ~/cano-distri-backend

# Configurar permisos para scripts
chmod +x wait-for-db.sh
chmod +x scripts/*.sh

# Copiar y configurar variables de entorno
cp .env.production .env
# Editar .env con tus valores seguros
nano .env
```

### 4. Desplegar

```bash
# Construir e iniciar servicios
docker-compose up --build -d

# Ver logs
docker-compose logs -f api

# Ver estado
docker-compose ps
```

### 5. Configurar Nginx Proxy Manager

1. Acceder a `http://tu-vps-ip:81`
2. Login inicial:
   - Email: `admin@example.com`
   - Password: `changeme`
3. Cambiar credenciales
4. Crear Proxy Host:
   - Domain: `api.tudominio.com`
   - Forward Hostname: `api`
   - Forward Port: `3000`
   - Habilitar SSL con Let's Encrypt

## 🔧 Gestión de la aplicación

### Comandos útiles

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f api
docker-compose logs -f db

# Reiniciar servicios
docker-compose restart api
docker-compose restart db

# Actualizar aplicación
git pull
docker-compose up --build -d api

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

### Gestión de backups

```bash
# Backup manual
docker-compose exec backup sh /scripts/backup.sh

# Listar backups disponibles
docker-compose exec backup sh /scripts/list-backups.sh

# Restaurar backup específico
docker-compose exec backup sh /scripts/restore.sh /backups/backup_cano_distri_db_20240906_030001.sql.gz

# Ver logs de backups programados
docker-compose logs backup
```

### Monitoreo

```bash
# Ver uso de recursos
docker stats

# Ver logs de la aplicación
docker-compose logs -f api | tail -100

# Verificar salud de la base de datos
docker-compose exec db pg_isready -U cano_user -d cano_distri_db

# Conectarse a la base de datos
docker-compose exec db psql -U cano_user -d cano_distri_db
```

## 🔒 Seguridad

### Configurar firewall

```bash
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 81    # NPM Admin (temporal)

# Después de configurar NPM, cerrar puerto 81
sudo ufw deny 81
```

### Variables de entorno seguras

1. Cambiar todas las claves en `.env` por valores seguros
2. Usar `openssl rand -base64 32` para generar claves
3. No commitear archivos `.env` en Git

## 🚨 Solución de problemas

### La aplicación no inicia

```bash
# Ver logs detallados
docker-compose logs api

# Verificar configuración de la base de datos
docker-compose exec db pg_isready -U $POSTGRES_USER -d $POSTGRES_DB

# Reconstruir contenedores
docker-compose down
docker-compose up --build -d
```

### Problemas de conexión a la base de datos

```bash
# Verificar que la DB esté corriendo
docker-compose ps db

# Ver logs de la DB
docker-compose logs db

# Verificar variables de entorno
docker-compose exec api env | grep -i postgres
```

### Backups no funcionan

```bash
# Verificar logs del servicio de backup
docker-compose logs backup

# Ejecutar backup manual para depurar
docker-compose exec backup sh /scripts/backup.sh

# Verificar permisos del directorio
ls -la backups/
```

## 📊 Monitoreo de producción

### Logs importantes

```bash
# Errores de la aplicación
docker-compose logs api | grep ERROR

# Conexiones a la base de datos
docker-compose logs api | grep "Database"

# Requests HTTP
docker-compose logs api | grep "HTTP"
```

### Métricas de sistema

```bash
# Uso de disco
df -h

# Uso de memoria
free -h

# Procesos Docker
docker system df
```
