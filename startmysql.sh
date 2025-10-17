#!/bin/bash

# 1️⃣ Verificar si MySQL está instalado
if ! command -v mysql >/dev/null 2>&1; then
    echo "MySQL no encontrado. Instalando..."
    sudo apt update && sudo apt install -y mysql-server
else
    echo "MySQL ya está instalado."
fi

# 2️⃣ Verificar si MySQL está corriendo
if ! sudo service mysql status >/dev/null 2>&1; then
    echo "MySQL no está corriendo. Iniciando..."
    sudo service mysql start
else
    echo "MySQL ya está corriendo."
fi

# 3️⃣ Configurar contraseña root si es necesario
ROOT_PASS="root"

# Comprobar si el root ya tiene contraseña mysql_native_password
MYSQL_AUTH=$(sudo mysql -e "SELECT plugin FROM mysql.user WHERE User='root';" -s -N)
if [[ "$MYSQL_AUTH" != "mysql_native_password" ]]; then
    echo "Configurando contraseña root..."
    sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$ROOT_PASS'; FLUSH PRIVILEGES;"
else
    echo "Contraseña root ya configurada."
fi

echo "✅ MySQL listo. Conectar con: mysql -u root -p"