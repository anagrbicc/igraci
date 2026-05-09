import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function AthleteProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/athletes/${id}`)
      .then(({ data }) => setAthlete(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  if (notFound) {
    return (
      <div className="empty-state" style={{ marginTop: '4rem' }}>
        <div className="empty-state-icon">🔍</div>
        <p>Sportista nije pronađen.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Nazad na listu</button>
      </div>
    );
  }

  return (
    <>
      <div className="profile-hero">
        <div className="profile-hero-inner">
          {athlete.photo_url ? (
            <img src={athlete.photo_url} alt={athlete.name} className="profile-photo" />
          ) : (
            <div className="profile-photo-placeholder">🏃</div>
          )}
          <div>
            <div className="profile-sport">{athlete.sport}</div>
            <h1 className="profile-name">{athlete.name}</h1>
            {athlete.club && <div className="profile-club">📍 {athlete.club}</div>}

            {(athlete.age || athlete.height || athlete.weight) && (
              <div className="profile-stats">
                {athlete.age && (
                  <div className="profile-stat">
                    <div className="profile-stat-value">{athlete.age}</div>
                    <div className="profile-stat-label">Godine</div>
                  </div>
                )}
                {athlete.height && (
                  <div className="profile-stat">
                    <div className="profile-stat-value">{athlete.height}</div>
                    <div className="profile-stat-label">Visina (cm)</div>
                  </div>
                )}
                {athlete.weight && (
                  <div className="profile-stat">
                    <div className="profile-stat-value">{athlete.weight}</div>
                    <div className="profile-stat-label">Težina (kg)</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-body">
        <div>
          {athlete.video_url && (
            <div style={{ marginBottom: '2rem' }}>
              <div className="profile-section">
                <h3>Promotivni video</h3>
              </div>
              <video
                src={athlete.video_url}
                controls
                style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: 480 }}
              />
            </div>
          )}

          {athlete.bio && (
            <div className="profile-section" style={{ marginBottom: '2rem' }}>
              <h3>O sportistu</h3>
              <p>{athlete.bio}</p>
            </div>
          )}

          {athlete.achievements && (
            <div className="profile-section" style={{ marginBottom: '2rem' }}>
              <h3>Dostignuća</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{athlete.achievements}</p>
            </div>
          )}
        </div>

        <div>
          {(athlete.contact_email || athlete.contact_phone) && (
            <div className="contact-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Kontakt
              </h3>
              {athlete.contact_email && (
                <div className="contact-item">
                  <span className="contact-icon">✉️</span>
                  <a href={`mailto:${athlete.contact_email}`} style={{ color: 'var(--accent)' }}>
                    {athlete.contact_email}
                  </a>
                </div>
              )}
              {athlete.contact_phone && (
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <a href={`tel:${athlete.contact_phone}`} style={{ color: 'var(--text)' }}>
                    {athlete.contact_phone}
                  </a>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ width: '100%' }}>
              ← Nazad
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
