const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userToken.id },
    });

    if (!subscription || subscription.subscriptionStatus !== 'paid') {
      return res.status(403).json({ error: 'Abonnement payant requis' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
