import { useState } from 'react'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

export default function AdminLogin({ onLogin, onBack }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleLogin() {
    setLoading(true)
    setTimeout(() => {
      if (pw === ADMIN_PASSWORD) { onLogin() }
      else { setError('Password salah!'); setLoading(false) }
    }, 600)
  }

  return (
    <div style={{
      minHeight:'100vh', background:'linear-gradient(135deg,#0a0a0f,#111827,#0a0a0f)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .inp:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.2)!important;}
        .btn-primary{transition:all .2s;cursor:pointer;}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,102,241,0.4)!important;}
      `}</style>
      <div style={{
        background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:'24px', padding:'48px 40px', width:'100%', maxWidth:'400px',
        animation:'fadeUp 0.5s ease',
      }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:'0.85rem', marginBottom:'24px', padding:0 }}>← Kembali</button>
        <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>🔐</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", color:'white', fontSize:'1.8rem', marginBottom:'6px' }}>Admin Login</h2>
        <p style={{ color:'#6b7280', fontSize:'0.85rem', marginBottom:'32px' }}>Masukkan password admin untuk melanjutkan</p>

        <label style={{ color:'#9ca3af', fontSize:'0.78rem', letterSpacing:'0.1em', textTransform:'uppercase' }}>Password</label>
        <input
          className="inp"
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Masukkan password..."
          style={{
            display:'block', width:'100%', marginTop:'8px', marginBottom:'8px',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:'12px', padding:'14px 16px', color:'white', fontSize:'0.95rem',
            transition:'all .2s',
          }}
        />
        {error && <p style={{ color:'#f87171', fontSize:'0.8rem', marginBottom:'8px' }}>{error}</p>}

        <button className="btn-primary" onClick={handleLogin} disabled={loading} style={{
          width:'100%', marginTop:'16px',
          background:'linear-gradient(135deg,#6366f1,#818cf8)',
          border:'none', borderRadius:'12px', padding:'14px',
          color:'white', fontSize:'1rem', fontWeight:'500',
          boxShadow:'0 4px 16px rgba(99,102,241,0.3)',
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Memeriksa...' : 'Masuk →'}
        </button>
      </div>
    </div>
  )
}
