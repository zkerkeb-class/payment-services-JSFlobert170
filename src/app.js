require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
require('./postgresConnection');

const subscriptionRoutes = require('./routes/subscriptionRoutes');

const app = express();

// Parse JSON bodies
app.use(bodyParser.json());

// Routes
app.use('/api/subscription', subscriptionRoutes);

// Route test
app.get('/', (req, res) => {
  res.send('API Paiement avec Stripe fonctionne');
});

// Erreur 404 simple
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
