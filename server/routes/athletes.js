const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { requireAuth, requirePaid } = require('../middleware/auth');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
fs.mkdirSync(path.join(uploadDir, 'photos'), { recursive: true });
fs.mkdirSync(path.join(uploadDir, 'videos'), { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadDir, file.fieldname === 'video' ? 'videos' : 'photos'));
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'photo' && /image\/(jpeg|png|webp)/.test(file.mimetype)) return cb(null, true);
  if (file.fieldname === 'video' && /video\/(mp4|webm|quicktime)/.test(file.mimetype)) return cb(null, true);
  cb(new Error('Nepodržan format fajla'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});

router.get('/', (req, res) => {
  const athletes = db.prepare(`
    SELECT a.*, u.email FROM athletes a
    JOIN users u ON u.id = a.user_id
    WHERE u.paid = 1 AND a.name IS NOT NULL AND a.name != ''
    ORDER BY a.updated_at DESC
  `).all();
  res.json(athletes);
});

router.get('/:id', (req, res) => {
  const athlete = db.prepare(`
    SELECT a.* FROM athletes a
    JOIN users u ON u.id = a.user_id
    WHERE a.id = ? AND u.paid = 1
  `).get(req.params.id);
  if (!athlete) return res.status(404).json({ error: 'Sportista nije pronađen' });
  res.json(athlete);
});

router.put('/profile', requireAuth, requirePaid, (req, res) => {
  const { name, sport, club, age, height, weight, achievements, contact_email, contact_phone, bio } = req.body;
  const existing = db.prepare('SELECT id FROM athletes WHERE user_id = ?').get(req.user.id);
  if (existing) {
    db.prepare(`
      UPDATE athletes SET name=?, sport=?, club=?, age=?, height=?, weight=?,
      achievements=?, contact_email=?, contact_phone=?, bio=?, updated_at=CURRENT_TIMESTAMP
      WHERE user_id=?
    `).run(name, sport, club, age, height, weight, achievements, contact_email, contact_phone, bio, req.user.id);
  } else {
    db.prepare(`
      INSERT INTO athletes (user_id, name, sport, club, age, height, weight, achievements, contact_email, contact_phone, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, name, sport, club, age, height, weight, achievements, contact_email, contact_phone, bio);
  }
  const athlete = db.prepare('SELECT * FROM athletes WHERE user_id = ?').get(req.user.id);
  res.json(athlete);
});

router.post('/upload', requireAuth, requirePaid, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]), (req, res) => {
  const existing = db.prepare('SELECT * FROM athletes WHERE user_id = ?').get(req.user.id);
  if (!existing) {
    db.prepare('INSERT INTO athletes (user_id) VALUES (?)').run(req.user.id);
  }

  if (req.files?.photo) {
    const photoUrl = `/uploads/photos/${req.files.photo[0].filename}`;
    if (existing?.photo_url) {
      const oldPath = path.join(__dirname, '..', existing.photo_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    db.prepare('UPDATE athletes SET photo_url = ? WHERE user_id = ?').run(photoUrl, req.user.id);
  }

  if (req.files?.video) {
    const videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
    if (existing?.video_url) {
      const oldPath = path.join(__dirname, '..', existing.video_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    db.prepare('UPDATE athletes SET video_url = ? WHERE user_id = ?').run(videoUrl, req.user.id);
  }

  const athlete = db.prepare('SELECT * FROM athletes WHERE user_id = ?').get(req.user.id);
  res.json(athlete);
});

module.exports = router;
