#!/bin/bash

# Script para hacer commit con actualización automática de versión
# Uso: ./scripts/commit-with-version.sh "mensaje del commit"

set -e  # Exit on error

# Verificar que se proporcionó un mensaje
if [ $# -eq 0 ]; then
    echo "❌ Error: Se requiere un mensaje de commit"
    echo "Uso: ./scripts/commit-with-version.sh 'mensaje del commit'"
    exit 1
fi

COMMIT_MESSAGE="$1"

# Obtener nombre del branch actual
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

echo "🔍 Branch actual: $BRANCH_NAME"

# Verificar que estamos en un branch con formato correcto
if [[ $BRANCH_NAME == version/v.* ]]; then
    # Extraer versión del nombre del branch
    NEW_VERSION=${BRANCH_NAME#version/v.}
    echo "📦 Versión detectada del branch: $NEW_VERSION"
    
    # Validar formato de versión semántica
    if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "❌ Error: Formato de versión inválido en branch name: $NEW_VERSION"
        echo "Debe ser X.Y.Z (ejemplo: 0.8.1)"
        exit 1
    fi
    
    # Actualizar package.json solo si es necesario
    CURRENT_PKG_VERSION=$(node -p "require('./package.json').version")
    if [[ $CURRENT_PKG_VERSION != $NEW_VERSION ]]; then
        echo "🔄 Actualizando package.json de $CURRENT_PKG_VERSION a $NEW_VERSION..."
        npm version $NEW_VERSION --no-git-tag-version
    else
        echo "✅ package.json ya está en la versión correcta: $NEW_VERSION"
    fi
    
    # Actualizar environments
    echo "🔄 Actualizando environments..."
    node scripts/update-version.js $NEW_VERSION
    
    echo "✅ Versión actualizada a: $NEW_VERSION"
    
elif [[ $BRANCH_NAME == "main" ]]; then
    echo "ℹ️ Commit en branch main - no se actualiza versión"
    
else
    echo "❌ Error: Branch debe tener formato 'version/v.X.Y.Z' o ser 'main'"
    echo "Branch actual: $BRANCH_NAME"
    echo "Ejemplo válido: version/v.0.8.1"
    exit 1
fi

# Verificar que hay cambios para commit
if [ -z "$(git status --porcelain)" ]; then
    echo "⚠️ No hay cambios para commit"
    exit 0
fi

# Agregar archivos al staging
echo "📋 Agregando archivos al staging..."
git add .

# Crear commit con formato estándar
echo "📝 Creando commit..."
git commit -m "$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "🎉 Commit creado exitosamente"
echo "📊 Archivos modificados:"
git show --name-only --pretty=format: HEAD | grep -v "^$" | sed 's/^/  - /'

# Mostrar información del commit
echo ""
echo "📋 Información del commit:"
echo "  Branch: $BRANCH_NAME"
if [[ $BRANCH_NAME == version/v.* ]]; then
    echo "  Versión: $NEW_VERSION"
fi
echo "  Hash: $(git rev-parse --short HEAD)"
echo "  Mensaje: $COMMIT_MESSAGE"