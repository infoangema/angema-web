#!/usr/bin/env node

/**
 * Script para actualizar la versión en los archivos de environment
 * Uso: node scripts/update-version.js [version]
 */

const fs = require('fs');
const path = require('path');

// Obtener versión del parámetro o del package.json
const version = process.argv[2] || require('../package.json').version;

if (!version) {
  console.error('❌ Error: Versión requerida');
  console.error('Uso: node scripts/update-version.js [version]');
  process.exit(1);
}

// Validar formato de versión semántica
const semverRegex = /^\d+\.\d+\.\d+$/;
if (!semverRegex.test(version)) {
  console.error('❌ Error: Formato de versión inválido. Use X.Y.Z (ejemplo: 0.8.1)');
  process.exit(1);
}

console.log(`🔄 Actualizando versión a: ${version}`);

// Función para actualizar environment file
function updateEnvironmentFile(filePath, isProduction = false) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Error: Archivo no encontrado: ${fullPath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Verificar si ya existe la propiedad version
    const versionRegex = /version:\s*['"`]([^'"`]+)['"`]/;
    const buildDateRegex = /buildDate:\s*['"`]([^'"`]+)['"`]/;
    
    const now = new Date();
    const buildDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const buildTime = now.toLocaleTimeString('es-ES', { hour12: false }); // HH:MM:SS
    
    if (versionRegex.test(content)) {
      // Verificar si ya está actualizada
      const currentVersion = content.match(versionRegex)[1];
      if (currentVersion === version) {
        console.log(`✅ ${filePath} ya está actualizado (v${version})`);
        return true;
      }
      // Actualizar versión existente
      content = content.replace(versionRegex, `version: '${version}'`);
    } else {
      // Agregar versión después de production
      const productionLine = isProduction ? 'production: true,' : 'production: false,';
      content = content.replace(
        productionLine,
        `${productionLine}\n  version: '${version}',`
      );
    }

    // Actualizar o agregar buildDate
    if (buildDateRegex.test(content)) {
      content = content.replace(buildDateRegex, `buildDate: '${buildDate}'`);
    } else {
      // Agregar buildDate después de version
      content = content.replace(
        `version: '${version}',`,
        `version: '${version}',\n  buildDate: '${buildDate}',`
      );
    }

    // Agregar buildTime si no existe
    if (!content.includes('buildTime:')) {
      content = content.replace(
        `buildDate: '${buildDate}',`,
        `buildDate: '${buildDate}',\n  buildTime: '${buildTime}',`
      );
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Actualizado: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error actualizando ${filePath}:`, error.message);
    return false;
  }
}

// Actualizar archivos de environment
const files = [
  { path: 'src/environments/environment.ts', isProduction: false },
  { path: 'src/environments/environment.prod.ts', isProduction: true }
];

let success = true;
files.forEach(file => {
  if (!updateEnvironmentFile(file.path, file.isProduction)) {
    success = false;
  }
});

if (success) {
  console.log(`🎉 Versión actualizada exitosamente a ${version}`);
  console.log(`📅 Build Date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`⏰ Build Time: ${new Date().toLocaleTimeString('es-ES', { hour12: false })}`);
} else {
  console.error('❌ Algunos archivos no pudieron ser actualizados');
  process.exit(1);
}