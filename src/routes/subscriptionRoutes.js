const express = require('express');
const router = express.Router();
const checkSubscription = require('../middlewares/checkSubscription');
const checkJWT = require('../middlewares/checkJWT');
const subscriptionController = require('../controllers/subscriptionController');

// Créer un abonnement payant
router.post('/create', checkJWT, subscriptionController.createSubscription);

// Webhook Stripe (note: body parser doit être raw, on le gère dans app.js si besoin)
router.post('/webhook', checkJWT, checkSubscription, express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// Contenu premium accessible seulement aux abonnés payants
router.get('/premium', checkJWT, checkSubscription, subscriptionController.getPremiumContent);

router.get('/extra', checkJWT, checkSubscription, subscriptionController.getExtraContent);

module.exports = router;
