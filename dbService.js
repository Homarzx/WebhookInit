const mysql = require('mysql2/promise');
const config = require('./config.json'); // Cargar configuración desde config.json

const dbConfig = config.database; // Configuración de la base de datos

/**
 * Verifica si un realm existe en la base de datos.
 * @param {string} realmId - El ID del realm a verificar.
 * @returns {boolean} - Devuelve true si el realm existe, false de lo contrario.
 */
async function doesRealmExist(realmId) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT COUNT(*) AS count FROM realm WHERE idRealm = ?',
      [realmId]
    );
    return rows[0].count > 0;
  } catch (error) {
    console.error('Error verificando el realm:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Registra un nuevo realm en la base de datos.
 * @param {string} realmId - El ID del realm a registrar.
 * @param {string} name - El nombre del realm.
 */
async function registerRealmData(realmId, name,type,id) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO webhook (idRealm, type,operation,id) VALUES (?, ?, ?, ?)',
      [realmId, name,type,id]
    );
    console.log(`Operación registrada correctamente.`);
  } catch (error) {
    console.error('Error registrando operación:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}


/**
 * Registra un nuevo realm en la base de datos.
 * @param {string} realmId - El ID del realm a registrar.
 * @param {string} authtoken - El nombre del realm.
 * @param {string} authtoken - El token de autorizacion.
 * @param {string} refreshToken - El token de refresco.
 */
async function registerRealmToken(realmId,authToken,refreshToken) {
  let connection;
  const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' '); // Formato YYYY-MM-DD HH:MM:SS
  try {
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'INSERT INTO token (realm, authToken,refreshToken,authTokenTime,refreshTokenTime) VALUES (?, ?, ?, ?, ?)',
      [realmId, authToken, refreshToken,currentDateTime,currentDateTime]
    );
    console.log(`Operación registrada correctamente.`);
  } catch (error) {
    console.error('Error registrando operación:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = { registerRealmToken, doesRealmExist, registerRealmData };
