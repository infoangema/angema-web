#!/bin/bash

# Script para crear branch de versión con formato correcto
# Uso: ./scripts/create-version-branch.sh [version]

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Se requiere especificar la versión"
    echo "Uso: ./scripts/create-version-branch.sh [version]"
    echo "Ejemplo: ./scripts/create-version-branch.sh 0.9.4"
    exit 1
fi

VERSION=$1

# Validar formato de versión semántica
if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Error: Formato de versión inválido: $VERSION"
    echo "Debe ser X.Y.Z (ejemplo: 0.9.4)"
    exit 1
fi

BRANCH_NAME="version/v.$VERSION"

# Verificar que no existe el branch
if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
    echo "❌ Error: El branch $BRANCH_NAME ya existe"
    exit 1
fi

# Verificar que estamos en un estado limpio
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Hay cambios sin commit. Commit o stash los cambios primero."
    exit 1
fi

# Crear y cambiar al branch
echo "🌿 Creando branch: $BRANCH_NAME"
git checkout -b $BRANCH_NAME

echo "✅ Branch creado exitosamente"
echo "📦 La versión se actualizará automáticamente"
echo "💡 Tip: Usa 'npm run commit \"mensaje\"' para commits con formato estándar"
