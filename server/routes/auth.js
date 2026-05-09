const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, paid: user.paid === 1 },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email i lozinka (min 6 znakova) su obavezni' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    const result = stmt.run(email, hash);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.json({ token: makeToken(user), user: { id: user.id, email: user.email, paid: false } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email već postoji' });
    }
    res.status(500).json({ error: 'Greška na serveru' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Pogrešan email ili lozinka' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Pogrešan email ili lozinka' });
  res.json({ token: makeToken(user), user: { id: user.id, email: user.email, paid: user.paid === 1 } });
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Niste prijavljeni' });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' });
    const athlete = db.prepare('SELECT * FROM athletes WHERE user_id = ?').get(user.id);
    res.json({ user: { id: user.id, email: user.email, paid: user.paid === 1 }, athlete });
  } catch {
    res.status(401).json({ error: 'Nevažeći token' });
  }
});

module.exports = router;
