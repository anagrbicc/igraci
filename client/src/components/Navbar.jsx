import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        Igra<span>či</span>
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/dashboard">
              <button className="btn btn-secondary">Moj profil</button>
            </Link>
            <button className="btn btn-outline" onClick={handleLogout}>Odjavi se</button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="btn btn-secondary">Prijavi se</button>
            </Link>
            <Link to="/register">
              <button className="btn btn-primary">Postani sportista</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
