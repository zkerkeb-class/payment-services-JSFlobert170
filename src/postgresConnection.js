const { PrismaClient } = require('@prisma/client');

// Configuration de Prisma avec le schéma centralisé
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Test de la connexion dès l'importation
prisma.$connect()
  .then(() => {
    console.log('Connecté à la base de données via Prisma');
  })
  .catch((err) => {
    console.error('Erreur de connexion à la base de données', err);
});

module.exports = prisma;
