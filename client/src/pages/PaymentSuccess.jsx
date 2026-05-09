import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      return;
    }
    api.get(`/stripe/verify?session_id=${sessionId}`)
      .then(({ data }) => {
        updateUser(data.user);
        localStorage.setItem('token', data.token);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'verifying') {
    return (
      <div className="success-page">
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Verifikacija plaćanja...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="success-page">
        <div className="success-icon">❌</div>
        <h1>Greška pri verifikaciji</h1>
        <p>Plaćanje nije potvrđeno ili je isteklo. Kontaktirajte podršku.</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
          Na dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="success-page">
      <div style={{ maxWidth: 500 }}>
        <div className="success-icon">🎉</div>
        <h1>Plaćanje uspešno!</h1>
        <p>Vaš nalog je aktiviran. Sada možete kreirati vaš sportski profil i dodati video.</p>
        <button
          className="btn btn-gold btn-lg"
          onClick={() => navigate('/dashboard')}
        >
          Kreiraj profil →
        </button>
      </div>
    </div>
  );
}
