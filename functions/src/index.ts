/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Inicializar la aplicación de Firebase Admin
admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Función para establecer claims personalizados
export const setCustomUserClaims = onCall(async (request) => {
  try {
    // Verificar que el usuario está autenticado
    if (!request.auth) {
      throw new Error('No autorizado');
    }

    const { uid, claims } = request.data;

    // Verificar que el usuario que hace la llamada tiene permisos
    const callerUid = request.auth.uid;
    const callerRef = admin.firestore().collection('users').doc(callerUid);
    const callerDoc = await callerRef.get();
    
    if (!callerDoc.exists) {
      throw new Error('Usuario no encontrado');
    }

    const callerData = callerDoc.data();
    if (!callerData || callerData.roleId !== 'root') {
      throw new Error('Permisos insuficientes');
    }

    // Establecer los claims personalizados
    await admin.auth().setCustomUserClaims(uid, claims);

    // Registrar la acción
    logger.info('Claims actualizados para el usuario', {
      uid,
      claims,
      updatedBy: callerUid
    });

    return { success: true };
  } catch (error) {
    logger.error('Error al actualizar claims:', error);
    throw new Error('Error al actualizar claims del usuario');
  }
});
