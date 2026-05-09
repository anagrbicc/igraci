import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AthleteCard from '../components/AthleteCard';
import api from '../api';

export default function Home() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/athletes')
      .then(r => setAthletes(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = athletes.filter(a => {
    const q = search.toLowerCase();
    return !q || a.name?.toLowerCase().includes(q) || a.sport?.toLowerCase().includes(q) || a.club?.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="hero">
        <h1>Platforma za <span>promociju</span><br />sportista</h1>
        <p>Predstavite se svetu sporta. Kreirajte profil, dodajte video i neka vas klupski skauti i navijači pronađu.</p>
        <div className="hero-actions">
          {user ? (
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
              Uredi moj profil
            </button>
          ) : (
            <>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
                Postani sportista – 20€
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
                Prijavi se
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page-wide">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            Sportisti ({filtered.length})
          </h2>
          <input
            type="text"
            placeholder="Pretraži po imenu, sportu, klubu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text)',
              fontSize: '0.9rem',
              width: '280px',
            }}
          />
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <p>{search ? 'Nema rezultata za pretragu.' : 'Još nema registrovanih sportista. Budite prvi!'}</p>
            {!user && (
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
                Pridruži se
              </button>
            )}
          </div>
        ) : (
          <div className="athletes-grid">
            {filtered.map(a => <AthleteCard key={a.id} athlete={a} />)}
          </div>
        )}
      </div>
    </>
  );
}
