#!/bin/bash

# Script para configurar versionado automático en branches
# Configura Git hooks para automatizar el versionado cuando se crea un branch version/v.X.Y.Z

echo "🔧 Configurando versionado automático para branches version/v.X.Y.Z"

# Crear directorio de hooks si no existe
mkdir -p .git/hooks

# Crear hook post-checkout para detectar cambios de branch
cat > .git/hooks/post-checkout << 'EOF'
#!/bin/bash

# Git hook: post-checkout
# Se ejecuta después de checkout a un branch
# Detecta branches con formato version/v.X.Y.Z y actualiza versión automáticamente

# Parámetros del hook
PREV_HEAD=$1
NEW_HEAD=$2
BRANCH_CHECKOUT=$3

# Solo ejecutar para cambios de branch (no para archivos individuales)
if [ "$BRANCH_CHECKOUT" = "1" ]; then
    # Obtener nombre del branch actual
    BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
    
    # Verificar si es un branch de versión
    if [[ $BRANCH_NAME == version/v.* ]]; then
        # Extraer versión del nombre del branch
        NEW_VERSION=${BRANCH_NAME#version/v.}
        
        # Validar formato de versión semántica
        if [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "🎯 Detectado branch de versión: $BRANCH_NAME"
            echo "📦 Actualizando versión automáticamente a: $NEW_VERSION"
            
            # Verificar versión actual
            CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0")
            
            if [[ $CURRENT_VERSION != $NEW_VERSION ]]; then
                echo "🔄 Actualizando desde $CURRENT_VERSION a $NEW_VERSION..."
                
                # Actualizar package.json
                npm version $NEW_VERSION --no-git-tag-version --quiet
                
                # Actualizar environments
                node scripts/update-version.js $NEW_VERSION
                
                echo "✅ Versión actualizada automáticamente"
                echo "💡 Tip: Usa 'npm run commit \"mensaje\"' para commits con formato estándar"
            else
                echo "✅ Versión ya está actualizada: $NEW_VERSION"
            fi
        else
            echo "⚠️ Branch de versión con formato inválido: $NEW_VERSION"
            echo "   Debe ser X.Y.Z (ejemplo: 0.8.1)"
        fi
    elif [[ $BRANCH_NAME == "main" ]]; then
        echo "🏠 Cambiado a branch main"
    else
        echo "📝 Cambiado a branch: $BRANCH_NAME"
    fi
fi
EOF

# Crear hook prepare-commit-msg para mejorar mensajes de commit
cat > .git/hooks/prepare-commit-msg << 'EOF'
#!/bin/bash

# Git hook: prepare-commit-msg
# Se ejecuta antes de abrir el editor de commit
# Agrega información de versión al mensaje de commit si es branch de versión

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Solo para commits normales (no merge, rebase, etc.)
if [ -z "$COMMIT_SOURCE" ] || [ "$COMMIT_SOURCE" = "message" ]; then
    BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
    
    # Si es un branch de versión, agregar información
    if [[ $BRANCH_NAME == version/v.* ]]; then
        VERSION=${BRANCH_NAME#version/v.}
        
        # Leer mensaje actual
        CURRENT_MSG=$(cat "$COMMIT_MSG_FILE")
        
        # Si el mensaje no contiene ya información de versión, agregarla
        if [[ ! $CURRENT_MSG =~ \[v\. ]]; then
            # Agregar versión al inicio del mensaje
            echo "[v.$VERSION] $CURRENT_MSG" > "$COMMIT_MSG_FILE"
        fi
    fi
fi
EOF

# Crear comando personalizado para crear branches de versión
cat > scripts/create-version-branch.sh << 'EOF'
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
EOF

# Hacer los hooks ejecutables
chmod +x .git/hooks/post-checkout
chmod +x .git/hooks/prepare-commit-msg
chmod +x scripts/create-version-branch.sh

# Actualizar package.json para incluir el nuevo comando
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['branch:version'] = 'scripts/create-version-branch.sh';
pkg.scripts['version:auto-setup'] = 'scripts/auto-version-setup.sh';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "✅ Configuración completada"
echo ""
echo "🎉 Versionado automático configurado exitosamente"
echo ""
echo "📋 Comandos disponibles:"
echo "  npm run branch:version [version]  - Crear branch de versión"
echo "  npm run commit \"mensaje\"          - Commit con formato estándar"
echo "  npm run version:check             - Verificar versión actual"
echo "  npm run version:update [version]  - Actualizar versión manualmente"
echo ""
echo "🔧 Funcionalidad automática:"
echo "  ✅ Al cambiar a branch version/v.X.Y.Z - Actualiza versión automáticamente"
echo "  ✅ Al hacer commit en branch versión - Agrega [v.X.Y.Z] al mensaje"
echo "  ✅ Al crear branch con npm run branch:version - Crea y configura automáticamente"
echo ""
echo "📝 Ejemplo de uso:"
echo "  npm run branch:version 0.9.4"
echo "  npm run commit \"feat: nueva funcionalidad\""
echo ""
echo "💡 Los cambios se aplicarán en el próximo checkout o creación de branch"