import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const SPORTS = [
  'Fudbal', 'Košarka', 'Odbojka', 'Tenis', 'Plivanje', 'Atletika',
  'Rukovanje', 'Boks', 'MMA', 'Džudo', 'Karate', 'Gimnastika',
  'Biciklizam', 'Skiing', 'Veslanje', 'Badminton', 'Streljaštvo', 'Ostalo',
];

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [athlete, setAthlete] = useState(null);
  const [form, setForm] = useState({
    name: '', sport: '', club: '', age: '', height: '', weight: '',
    achievements: '', contact_email: '', contact_phone: '', bio: '',
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const photoRef = useRef();
  const videoRef = useRef();

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      if (data.athlete) {
        setAthlete(data.athlete);
        setForm({
          name: data.athlete.name || '',
          sport: data.athlete.sport || '',
          club: data.athlete.club || '',
          age: data.athlete.age || '',
          height: data.athlete.height || '',
          weight: data.athlete.weight || '',
          achievements: data.athlete.achievements || '',
          contact_email: data.athlete.contact_email || '',
          contact_phone: data.athlete.contact_phone || '',
          bio: data.athlete.bio || '',
        });
        if (data.athlete.photo_url) setPhotoPreview(data.athlete.photo_url);
        if (data.athlete.video_url) setVideoPreview(data.athlete.video_url);
      }
    });
  }, []);

  async function handlePayment() {
    setPaymentLoading(true);
    try {
      const { data } = await api.post('/stripe/create-checkout-session');
      window.location.href = data.url;
    } catch {
      setError('Greška pri pokretanju plaćanja. Pokušajte ponovo.');
      setPaymentLoading(false);
    }
  }

  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleVideo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put('/athletes/profile', form);
      setAthlete(data);
      setSuccess('Profil sačuvan!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Greška pri čuvanju profila');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload() {
    if (!photoFile && !videoFile) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      if (photoFile) fd.append('photo', photoFile);
      if (videoFile) fd.append('video', videoFile);
      const { data } = await api.post('/athletes/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAthlete(data);
      setPhotoFile(null);
      setVideoFile(null);
      setSuccess('Fajlovi uspešno otpremljeni!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Greška pri otpremanju fajlova');
    } finally {
      setUploading(false);
    }
  }

  if (!user?.paid) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Moj profil</h1>
          <p>Dobrodošli, {user?.email}</p>
        </div>
        <div className="payment-banner">
          <h2>Aktivirajte vaš sportski profil</h2>
          <p>Platite jednokratnu godišnju naknadu i počnite da se promovišete.</p>
          <div className="price-tag">20€ <span>/ godišnje</span></div>
          <ul style={{ listStyle: 'none', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <li>✓ Javni sportski profil</li>
            <li>✓ Upload fotografije</li>
            <li>✓ Upload promotivnog videa</li>
            <li>✓ Vidljivo skautima i navijačima</li>
          </ul>
          <button
            className="btn btn-gold btn-lg"
            onClick={handlePayment}
            disabled={paymentLoading}
          >
            {paymentLoading ? <><span className="spinner" /> Učitavanje...</> : 'Plati 20€ i aktiviraj profil'}
          </button>
          {error && <div className="error-msg" style={{ marginTop: '1rem' }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Moj profil</h1>
        <p>
          {user?.email} &nbsp;
          <span className="badge badge-paid">Aktiviran</span>
          {athlete?.name && (
            <a href={`/sportista/${athlete.id}`} style={{ marginLeft: '1rem', color: 'var(--accent)', fontSize: '0.9rem' }}>
              Pogledaj javni profil →
            </a>
          )}
        </p>
      </div>

      {success && <div className="success-msg">{success}</div>}
      {error && <div className="error-msg">{error}</div>}

      {/* Photo & Video */}
      <div className="card">
        <h3>Fotografija i video</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              Profilna fotografija
            </label>
            {photoPreview && (
              <img src={photoPreview} alt="Preview" className="preview-img" />
            )}
            <label className="upload-area">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} ref={photoRef} />
              <div className="upload-icon">📷</div>
              <div className="upload-label">{photoPreview ? 'Promeni fotografiju' : 'Dodaj fotografiju'}</div>
              <p>JPG, PNG, WebP – max 5MB</p>
            </label>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              Promotivni video
            </label>
            {videoPreview && (
              <video src={videoPreview} controls className="preview-video" style={{ marginBottom: '1rem', maxHeight: 160 }} />
            )}
            <label className="upload-area">
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideo} ref={videoRef} />
              <div className="upload-icon">🎬</div>
              <div className="upload-label">{videoPreview ? 'Promeni video' : 'Dodaj video'}</div>
              <p>MP4, WebM, MOV – max 200MB</p>
            </label>
          </div>
        </div>
        {(photoFile || videoFile) && (
          <button
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? <><span className="spinner" /> Otpremanje...</> : 'Otpremi fajlove'}
          </button>
        )}
      </div>

      {/* Profile form */}
      <form onSubmit={handleSaveProfile}>
        <div className="card">
          <h3>Osnovni podaci</h3>
          <div className="form-group">
            <label>Puno ime *</label>
            <input name="name" value={form.name} onChange={handleFormChange} placeholder="Ime i prezime" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Sport *</label>
              <select name="sport" value={form.sport} onChange={handleFormChange} required>
                <option value="">Izaberite sport</option>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Klub / Tim</label>
              <input name="club" value={form.club} onChange={handleFormChange} placeholder="Naziv kluba" />
            </div>
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label>Godine</label>
              <input name="age" type="number" min="5" max="100" value={form.age} onChange={handleFormChange} placeholder="npr. 22" />
            </div>
            <div className="form-group">
              <label>Visina (cm)</label>
              <input name="height" type="number" min="100" max="250" value={form.height} onChange={handleFormChange} placeholder="npr. 185" />
            </div>
            <div className="form-group">
              <label>Težina (kg)</label>
              <input name="weight" type="number" min="30" max="200" value={form.weight} onChange={handleFormChange} placeholder="npr. 80" />
            </div>
          </div>
          <div className="form-group">
            <label>O sebi / Biografija</label>
            <textarea name="bio" value={form.bio} onChange={handleFormChange} placeholder="Kratko opišite sebe, svoju sportsku karijeru..." />
          </div>
          <div className="form-group">
            <label>Dostignuća i trofeje</label>
            <textarea name="achievements" value={form.achievements} onChange={handleFormChange} placeholder="npr. Prvak Srbije 2023, MVP sezone..." />
          </div>
        </div>

        <div className="card">
          <h3>Kontakt podaci</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Kontakt email</label>
              <input name="contact_email" type="email" value={form.contact_email} onChange={handleFormChange} placeholder="kontakt@email.com" />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input name="contact_phone" type="tel" value={form.contact_phone} onChange={handleFormChange} placeholder="+381 60 123 4567" />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
          {saving ? <><span className="spinner" /> Čuvanje...</> : 'Sačuvaj profil'}
        </button>
      </form>
    </div>
  );
}
