require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const queryString = require('query-string');
const auth = require('./auth');
const config = require('./config.json');

const app = express();
const port = 3000;
const { registerRealmToken, doesRealmExist, registerRealmData } = require('./dbService'); // Importar funciones del servicio


// Configuración de vistas y middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));

// Ruta principal
app.get('/', (req, res) => {
  res.send('Bienvenido. Usa /auth para autenticarte.');
});

// Ruta para obtener la URI de autorización
app.get('/auth', (req, res) => {
    try {
      const authUri = auth.getAuthUri(); // Obtiene la URL de autorización
      res.redirect(authUri); // Redirige al usuario a la página de autorización de Intuit
    } catch (error) {
      console.error('Error generando la URL de autorización:', error);
      res.status(500).send('Error generando la URL de autorización.');
    }
  });

// Ruta de callback para manejar el código de autorización
app.get('/callback', async (req, res) => {
    try {
      if (!req.query.code) {
        return res.status(400).send('Código de autorización no proporcionado.');
      }
  
      const parseRedirect = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const realm = req.query.realmId;
      const tokens = await auth.createToken(parseRedirect); // Genera los tokens
      req.session.tokens = tokens; // Guarda los tokens en la sesión del usuario
      registerRealmToken(realm,tokens.access_token,tokens.refresh_token);
      res.send('Autenticación exitosa. Puedes cerrar esta ventana.');
    } catch (error) {
      console.error('Error durante el callback:', error);
      res.status(500).send('Error manejando el callback de autorización.');
    }
  });

// Ruta para procesar las notificaciones webhook
  app.post('/webhook', async (req, res) => {
    const notifications = req.body.eventNotifications;
  
    if (!notifications || notifications.length === 0) {
      return res.status(200).send('No hay notificaciones.');
    }
  
    try {
      for (const notification of notifications) {
        const entities = notification.dataChangeEvent.entities;
        const realm = notification.realmId;
        for (const entity of entities) {
          console.log(realm);
          if(doesRealmExist(realm)){
            registerRealmData(realm,entity.name,entity.operation,entity.id)
          }
        }
      }
      res.status(200).send('Notificaciones procesadas.');
    } catch (error) {
      console.error('Error procesando webhook:', error);
      res.status(500).send('Error procesando webhook.');
    }
  }); 

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});