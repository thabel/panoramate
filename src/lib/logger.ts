import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: 'debug',
  browser: {
    asObject: false // Affiche des lignes de texte simples dans la console du navigateur
  }
});
