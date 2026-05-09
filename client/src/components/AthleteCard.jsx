import { useNavigate } from 'react-router-dom';

export default function AthleteCard({ athlete }) {
  const navigate = useNavigate();

  return (
    <div className="athlete-card" onClick={() => navigate(`/sportista/${athlete.id}`)}>
      {athlete.photo_url ? (
        <div className="athlete-card-photo">
          <img src={athlete.photo_url} alt={athlete.name} />
        </div>
      ) : (
        <div className="athlete-card-placeholder">🏃</div>
      )}
      <div className="athlete-card-info">
        <div className="athlete-card-sport">{athlete.sport || 'Sport'}</div>
        <div className="athlete-card-name">{athlete.name}</div>
        {athlete.club && <div className="athlete-card-club">{athlete.club}</div>}
        {athlete.age && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {athlete.age} god.
            {athlete.height ? ` · ${athlete.height} cm` : ''}
            {athlete.weight ? ` · ${athlete.weight} kg` : ''}
          </div>
        )}
      </div>
    </div>
  );
}
