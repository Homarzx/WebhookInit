const config = require('./config.json');
const OAuthClient = require('intuit-oauth');

// Configuración del cliente OAuth
const oauthClient = new OAuthClient({
  clientId: config.clientId,
  clientSecret: config.clientSecret,
  environment: 'sandbox', // Cambiar a 'production' según el entorno
  redirectUri: config.redirectUri,
});

/**
 * Genera la URI de autorización.
 * @returns {string} La URL de autorización.
 */
function getAuthUri() {
  return oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
    state: 'testState',
  });
}

/**
 * Crea un token a partir del redirect URI.
 * @param {string} parseRedirect - La URI que contiene el código de autorización.
 * @returns {Promise<object>} Los tokens generados.
 */
async function createToken(parseRedirect) {
  try {
    const authResponse = await oauthClient.createToken(parseRedirect);
    return authResponse.getJson();
  } catch (e) {
    console.error('Error al generar el token:', e.originalMessage);
    throw e;
  }
}

/**
 * Verifica si el token de acceso es válido.
 * @returns {boolean} `true` si el token es válido, `false` de lo contrario.
 */
function isAccessTokenValid() {
  return oauthClient.isAccessTokenValid();
}

/**
 * Refresca el token de acceso si ha expirado.
 * @returns {Promise<object>} Los nuevos tokens generados.
 */
async function refreshTokens() {
  try {
    const authResponse = await oauthClient.refresh();
    console.log('Tokens actualizados:', authResponse.getJson());
    return authResponse.getJson();
  } catch (e) {
    console.error('Error al refrescar los tokens:', e.originalMessage);
    throw e;
  }
}

/**
 * Simula la descarga de información usando un ID y un tipo.
 * @param {string} id - El ID del recurso.
 * @param {string} type - El tipo de recurso.
 * @returns {Promise<string>} Mensaje de confirmación.
 */
async function downloadInfo(realm,id, type,operation) {
  if (!isAccessTokenValid()) {
    await refreshTokens();
  }
  if(type == 'Invoice'){
    getInvoice(realm,id);
  }
  //return `Descargando información para Realm ${realm}, ID: ${id}, Tipo: ${type}, operacion ${operation}`;
}

/**
 * Consulta invoices en QuickBooks.
 * @param {object} itemData - Los datos del ítem a crear.
 * @returns {Promise<object>} La respuesta de la API.
 */
async function getInvoice(realm,id) {
  if (!isAccessTokenValid()) {
    await refreshTokens();
  }

  try {
    const response = await oauthClient.makeApiCall({
      url: `https://sandbox-quickbooks.api.intuit.com/v3/company/${realm}/invoice/${id}`, // ID en la URL
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = response.json.Invoice;
    console.log(data);
    console.log(data.Line);
    return response;
  } catch (e) {
    console.error('Error al obtener la factura:', e.originalMessage);
    throw e;
  }
}

module.exports = {
  getAuthUri,
  createToken,
  isAccessTokenValid,
  refreshTokens,
  downloadInfo,
};
