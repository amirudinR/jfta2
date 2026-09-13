import GoogleIcon from './GoogleIcon'

// LoginGate — halaman login layar penuh. Wajib login sebelum masuk aplikasi.
export default function LoginGate({ onLogin, loading, error }) {
  return (
    <div className="login-gate">
      <div className="login-gate-card">
        <div className="login-hanko">暗記</div>
        <h1 className="login-title">暗記帳</h1>
        <p className="login-sub">アンキチョウ · Hafalan Bahasa Jepang</p>
        <p className="login-desc">
          Masuk dengan Google untuk menyimpan progres hafalanmu dan menyinkronkannya
          antar perangkat.
        </p>

        <button className="profil-login-btn login-google-btn" onClick={onLogin} disabled={loading}>
          <GoogleIcon size={20} />
          <span>{loading ? 'Menghubungkan…' : 'Masuk dengan Google'}</span>
        </button>

        {error ? <p className="login-error">{error}</p> : null}

        <p className="login-foot">Kamu harus masuk untuk menggunakan aplikasi ini.</p>
      </div>
    </div>
  )
}
