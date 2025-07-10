const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  try {
    const userId = req.userToken.id;
    console.log("userToken:", req.userToken);
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    if (!subscription || subscription.subscriptionStatus !== 'paid') {
      return res.status(403).json({ error: 'Abonnement payant requis' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
