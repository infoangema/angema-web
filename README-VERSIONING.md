# Sistema de Versionado Semántico - Angema Web

## 📖 Descripción

Este proyecto implementa un sistema de versionado semántico completo que automatiza la gestión de versiones en branches, environments y la interfaz de usuario.

## 🏷️ Formato de Branches

### Convención
```bash
version/v.X.Y.Z
```

**Ejemplos:**
- `version/v.0.8.1` - Fix menor
- `version/v.0.9.0` - Nueva funcionalidad
- `version/v.1.0.0` - Release mayor

### Tipos de Versión
- **MAJOR** (X): Cambios incompatibles en API
- **MINOR** (Y): Funcionalidades nuevas compatibles
- **PATCH** (Z): Correcciones de bugs

## 🔧 Scripts Disponibles

### 1. Verificación de Versiones
```bash
npm run version:check
```
Verifica que todas las versiones estén sincronizadas:
- package.json
- environment.ts
- environment.prod.ts
- Nombre del branch

### 2. Actualización de Versión
```bash
npm run version:update [version]
node scripts/update-version.js 0.8.1
```
Actualiza la versión en los archivos de environment con fecha y hora de build.

### 3. Commit con Versionado
```bash
npm run commit "mensaje del commit"
./scripts/commit-with-version.sh "feat: nueva funcionalidad"
```
Hace commit automáticamente actualizando versiones según el branch.

## 🚀 Flujo de Trabajo

### 1. Crear Branch
```bash
git checkout -b version/v.0.8.1
```

### 2. Desarrollar
```bash
# Hacer cambios en el código
# ...
```

### 3. Commit Automático
```bash
npm run commit "feat: implementar sistema de versionado automático"
```

### 4. Verificar Consistencia
```bash
npm run version:check
```

## 📁 Archivos Involucrados

### Scripts
- `scripts/update-version.js` - Actualiza versiones en environments
- `scripts/commit-with-version.sh` - Commit con versionado automático
- `scripts/version-check.sh` - Verifica consistencia de versiones

### Archivos de Configuración
- `package.json` - Versión principal del proyecto
- `src/environments/environment.ts` - Versión para desarrollo
- `src/environments/environment.prod.ts` - Versión para producción

### Componentes UI
- `src/app/shared/components/footer/footer.component.ts` - Footer con versión
- `src/app/modules/stockin-manager/components/shared/navbar.component.ts` - Navbar con versión

## 🎯 Información Mostrada

### Footer del Sitio Web
```
© 2021. Angema SAS. Todos los derechos reservados.
Versión 0.8.1 - Build 2025-07-14 | 12:00:00
```

### Navbar de StockIn Manager
```
StockIn Manager
v0.8.1
```

## 📊 Estructura de Datos

### Environment Files
```typescript
export const environment = {
  production: false,
  version: '0.8.1',
  buildDate: '2025-07-14',
  buildTime: '12:00:00',
  firebase: {
    // ... configuración Firebase
  }
};
```

### Package.json
```json
{
  "name": "angema-web",
  "version": "0.8.1",
  "scripts": {
    "commit": "scripts/commit-with-version.sh",
    "version:check": "scripts/version-check.sh",
    "version:update": "node scripts/update-version.js"
  }
}
```

## 🔍 Validaciones

### Pre-commit
- Verifica formato de branch `version/v.X.Y.Z`
- Valida consistencia de versiones
- Actualiza automáticamente archivos de environment

### Build Time
- Actualiza fecha y hora de build
- Sincroniza versiones en todos los archivos
- Genera información de build para debugging

## 🛠️ Comandos Útiles

### Desarrollo
```bash
# Verificar versión actual
npm run version:check

# Actualizar versión manualmente
npm run version:update 0.8.2

# Hacer commit con versionado
npm run commit "fix: corregir bug en productos"
```

### Información
```bash
# Ver versión actual
node -p "require('./package.json').version"

# Ver configuración de environment
grep -A 5 "version:" src/environments/environment.ts
```

## 📝 Ejemplo de Uso Completo

```bash
# 1. Crear branch con nueva versión
git checkout -b version/v.0.8.2

# 2. Hacer cambios de código
# ... editar archivos ...

# 3. Commit automático (actualiza versiones)
npm run commit "fix: resolver problema de cache en productos"

# 4. Verificar que todo esté correcto
npm run version:check

# 5. Resultado esperado
✅ Todas las versiones son consistentes
📅 Build Date: 2025-07-14
⏰ Build Time: 12:05:30
```

## 🔧 Personalización

### Modificar Scripts
Los scripts están en la carpeta `scripts/` y pueden ser personalizados:
- `update-version.js` - Lógica de actualización
- `commit-with-version.sh` - Proceso de commit
- `version-check.sh` - Validaciones

### Agregar Nuevos Archivos
Para incluir más archivos en el versionado, editar `update-version.js`:
```javascript
const files = [
  { path: 'src/environments/environment.ts', isProduction: false },
  { path: 'src/environments/environment.prod.ts', isProduction: true },
  { path: 'src/app/config/version.ts', isProduction: false }, // Nuevo archivo
];
```

## 📋 Troubleshooting

### Error: Branch debe tener formato correcto
```bash
# Crear branch con formato correcto
git checkout -b version/v.0.8.1
```

### Error: Versiones inconsistentes
```bash
# Sincronizar versiones
npm run version:update 0.8.1
```

### Error: Permisos de ejecución
```bash
# Dar permisos a scripts
chmod +x scripts/*.sh
```

## 🎉 Beneficios

1. **Automatización**: Versionado automático en commits
2. **Consistencia**: Todas las versiones sincronizadas
3. **Trazabilidad**: Fecha y hora de build en producción
4. **Validación**: Verificación automática de formatos
5. **Visibilidad**: Versión visible en la interfaz
6. **Debugging**: Información de build para soporte

---

*Este sistema fue implementado en la versión 0.8.1 del proyecto Angema Web*