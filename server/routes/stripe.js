const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db } = require('../db');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');

router.post('/create-checkout-session', requireAuth, async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Sportista profil – godišnja pretplata',
            description: 'Kreirajte vaš sportski profil i promovišite se',
          },
          unit_amount: 2000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/dashboard`,
      customer_email: req.user.email,
    });
    db.prepare('UPDATE users SET stripe_session_id = ? WHERE id = ?').run(session.id, req.user.id);
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Greška pri kreiranju Stripe sesije' });
  }
});

router.get('/verify', requireAuth, async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Nedostaje session_id' });
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid') {
      db.prepare('UPDATE users SET paid = 1 WHERE id = ?').run(req.user.id);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      const token = jwt.sign(
        { id: user.id, email: user.email, paid: true },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      res.json({ success: true, token, user: { id: user.id, email: user.email, paid: true } });
    } else {
      res.status(400).json({ error: 'Plaćanje nije završeno' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Greška pri verifikaciji plaćanja' });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      db.prepare('UPDATE users SET paid = 1 WHERE stripe_session_id = ?').run(session.id);
    }
  }
  res.json({ received: true });
});

module.exports = router;
