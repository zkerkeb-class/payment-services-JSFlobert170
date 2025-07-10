const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createSubscription = async (req, res) => {
  const { paymentMethodId } = req.body;
  const userId = req.userToken.id;

  if (!paymentMethodId) return res.status(400).json({ error: 'paymentMethodId requis' });

  try {

    if (existingSubscription) {
      return res.status(400).json({ error: 'Vous avez déjà un abonnement' });
    }
    // Vérifier s'il existe déjà un abonnement pour cet utilisateur
    let subscriptionRecord = await prisma.subscription.findUnique({
      where: { userId },
    });

    // Créer ou récupérer Stripe customer
    let stripeCustomerId = subscriptionRecord?.stripeCustomerId;

    if (!stripeCustomerId) {
      // Ici, tu devrais appeler le service Auth via API pour récupérer l'email utilisateur
      // Ou passer l'email dans le token JWT (payload) si possible
      // Pour l’exemple, on suppose que tu passes email dans le token ou dans la requête
      const email = req.userToken.email;
      if (!email) return res.status(400).json({ error: 'Email requis pour création client Stripe' });

      const customer = await stripe.customers.create({
        email,
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId },
      });
      stripeCustomerId = customer.id;
    } else {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId });
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Créer l’abonnement Stripe
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: 'price_xxx' }], // Remplace par ton price ID Stripe
      expand: ['latest_invoice.payment_intent'],
    });

    // Mettre à jour ou créer la ligne abonnement en DB
    if (subscriptionRecord) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: 'paid',
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: 'paid',
        },
      });
    }

    res.json({ message: 'Abonnement créé', subscription });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).send(`Webhook error: ${err.message}`);
    }
  
    if (event.type === 'invoice.payment_succeeded') {
      const subscriptionId = event.data.object.subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { subscriptionStatus: 'paid' },
      });
    }
  
    if (event.type === 'customer.subscription.deleted') {
      const subscriptionId = event.data.object.id;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { subscriptionStatus: 'free', stripeSubscriptionId: null },
      });
    }
  
    res.json({ received: true });
};

exports.getPremiumContent = (req, res) => {
    res.json({ message: 'Voici le contenu réservé aux abonnés payants premium' });
};

exports.getExtraContent = (req, res) => {
    res.json({ message: 'Voici le contenu réservé aux abonnés payants extra' });
};
  
