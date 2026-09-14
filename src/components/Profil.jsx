import { LogOut, User as UserIcon } from 'lucide-react'
import GoogleIcon from './GoogleIcon'

export default function Profil({ user, loading, onLogin, onLogout }) {
  const handleLogout = () => {
    if (window.confirm('Yakin ingin keluar?')) onLogout()
  }

  return (
    <div className="profil-page">
      <h2 className="profil-title">Profil</h2>

      {loading ? (
        <div className="profil-card">
          <p className="muted">Memuat...</p>
        </div>
      ) : user ? (
        <>
          <div className="profil-card">
            <div className="profil-info">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="profil-avatar" referrerPolicy="no-referrer" />
              ) : (
                <div className="profil-avatar-placeholder"><UserIcon size={28} /></div>
              )}
              <div>
                <div className="profil-name">{user.displayName || 'User'}</div>
                <div className="profil-email">{user.email}</div>
              </div>
            </div>
            <p className="profil-sync-note">
              Progress tersimpan & tersinkron ke akun Google-mu.
            </p>
          </div>
          <button className="profil-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </>
      ) : (
        <div className="profil-card">
          <div className="profil-guest">
            <UserIcon size={32} className="profil-guest-icon" />
            <p>Login untuk menyimpan progress ke cloud dan sinkron antar perangkat.</p>
          </div>
          <button className="profil-login-btn" onClick={onLogin}>
            <GoogleIcon size={18} />
            <span>Login dengan Google</span>
          </button>
        </div>
      )}
    </div>
  )
}
