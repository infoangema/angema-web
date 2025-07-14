#!/bin/bash

# Script para verificar consistencia de versiones
# Uso: ./scripts/version-check.sh

echo "🔍 Verificando consistencia de versiones..."

# Obtener versión de package.json
PACKAGE_VERSION=$(node -p "require('./package.json').version")
echo "📦 package.json: $PACKAGE_VERSION"

# Obtener versión de environment.ts
ENV_VERSION=$(grep -o "version: '[^']*'" src/environments/environment.ts | cut -d"'" -f2)
echo "🔧 environment.ts: $ENV_VERSION"

# Obtener versión de environment.prod.ts
ENV_PROD_VERSION=$(grep -o "version: '[^']*'" src/environments/environment.prod.ts | cut -d"'" -f2)
echo "🚀 environment.prod.ts: $ENV_PROD_VERSION"

# Obtener nombre del branch
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
echo "🌿 Branch: $BRANCH_NAME"

# Verificar consistencia
CONSISTENT=true

if [[ $BRANCH_NAME == version/v.* ]]; then
    BRANCH_VERSION=${BRANCH_NAME#version/v.}
    echo "🏷️ Versión del branch: $BRANCH_VERSION"
    
    if [[ $PACKAGE_VERSION != $BRANCH_VERSION ]]; then
        echo "❌ Error: package.json ($PACKAGE_VERSION) != branch ($BRANCH_VERSION)"
        CONSISTENT=false
    fi
    
    if [[ $ENV_VERSION != $BRANCH_VERSION ]]; then
        echo "❌ Error: environment.ts ($ENV_VERSION) != branch ($BRANCH_VERSION)"
        CONSISTENT=false
    fi
    
    if [[ $ENV_PROD_VERSION != $BRANCH_VERSION ]]; then
        echo "❌ Error: environment.prod.ts ($ENV_PROD_VERSION) != branch ($BRANCH_VERSION)"
        CONSISTENT=false
    fi
fi

if [[ $ENV_VERSION != $ENV_PROD_VERSION ]]; then
    echo "❌ Error: environment.ts ($ENV_VERSION) != environment.prod.ts ($ENV_PROD_VERSION)"
    CONSISTENT=false
fi

if [[ $PACKAGE_VERSION != $ENV_VERSION ]]; then
    echo "❌ Error: package.json ($PACKAGE_VERSION) != environment.ts ($ENV_VERSION)"
    CONSISTENT=false
fi

if [[ $CONSISTENT == true ]]; then
    echo "✅ Todas las versiones son consistentes"
    
    # Mostrar información adicional
    if [[ -f "src/environments/environment.ts" ]]; then
        BUILD_DATE=$(grep -o "buildDate: '[^']*'" src/environments/environment.ts | cut -d"'" -f2)
        BUILD_TIME=$(grep -o "buildTime: '[^']*'" src/environments/environment.ts | cut -d"'" -f2)
        
        if [[ -n $BUILD_DATE ]]; then
            echo "📅 Build Date: $BUILD_DATE"
        fi
        
        if [[ -n $BUILD_TIME ]]; then
            echo "⏰ Build Time: $BUILD_TIME"
        fi
    fi
    
    exit 0
else
    echo "❌ Inconsistencias encontradas en las versiones"
    echo "💡 Ejecuta: node scripts/update-version.js $PACKAGE_VERSION"
    exit 1
fi