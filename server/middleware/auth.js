const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Niste prijavljeni' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Nevažeći token' });
  }
}

function requirePaid(req, res, next) {
  if (!req.user.paid) {
    return res.status(403).json({ error: 'Potrebno je platiti 20€ za pristup' });
  }
  next();
}

module.exports = { requireAuth, requirePaid };
