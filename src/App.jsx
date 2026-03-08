import { useState, useEffect } from 'react'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import UserSelect from './pages/UserSelect'
import UserForm from './pages/UserForm'

export default function App() {
  const [page, setPage] = useState('home') // home | admin-login | admin | user-select | user-form
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_logged_in')
    if (saved === 'true') setAdminLoggedIn(true)
  }, [])

  if (page === 'admin-login') {
    return <AdminLogin onLogin={() => { setAdminLoggedIn(true); sessionStorage.setItem('admin_logged_in','true'); setPage('admin') }} onBack={() => setPage('home')} />
  }
  if (page === 'admin' && adminLoggedIn) {
    return <AdminDashboard onLogout={() => { setAdminLoggedIn(false); sessionStorage.removeItem('admin_logged_in'); setPage('home') }} />
  }
  if (page === 'user-select') {
    return <UserSelect onSelect={(u) => { setSelectedUser(u); setPage('user-form') }} onBack={() => setPage('home')} />
  }
  if (page === 'user-form' && selectedUser) {
    return <UserForm user={selectedUser} onBack={() => setPage('user-select')} />
  }

  // Home
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0a0a0f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Georgia', serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        .home-btn { transition: all 0.25s ease; cursor: pointer; border: none; }
        .home-btn:hover { transform: translateY(-4px); }
      `}</style>

      {/* Decorative blobs */}
      <div style={{ position:'absolute', top:'10%', left:'5%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, #1e3a5f44, transparent 70%)', animation:'pulse 4s ease-in-out infinite' }}/>
      <div style={{ position:'absolute', bottom:'10%', right:'5%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, #2d1b6944, transparent 70%)', animation:'pulse 5s ease-in-out infinite 1s' }}/>

      <div style={{ textAlign:'center', zIndex:1, animation:'fadeUp 0.6s ease' }}>
        {/* Badge */}
        <div style={{
          display:'inline-block', background:'rgba(99,102,241,0.15)',
          border:'1px solid rgba(99,102,241,0.4)',
          borderRadius:'99px', padding:'6px 20px',
          color:'#a5b4fc', fontSize:'0.72rem', letterSpacing:'0.15em',
          textTransform:'uppercase', marginBottom:'24px',
          fontFamily:"'DM Sans', sans-serif",
        }}>Pertanyaan & Pengisian</div>

        <h1 style={{
          fontFamily:"'Playfair Display', serif",
          fontSize:'clamp(2.2rem, 5vw, 3.5rem)',
          color:'white', fontWeight:'700',
          lineHeight:1.15, marginBottom:'14px',
          letterSpacing:'-0.02em',
        }}>Kabupaten<br/><span style={{ color:'#818cf8' }}>Layak Anak</span></h1>

        <p style={{
          color:'#6b7280', fontSize:'1rem',
          fontFamily:"'DM Sans', sans-serif",
          marginBottom:'48px', maxWidth:'360px', margin:'0 auto 48px',
          lineHeight:1.7,
        }}>Untuk Kluster Dinas Pendidikan & Kebudayaan Kab. Pamekasan</p>

        <div style={{ display:'flex', gap:'16px', justifyContent:'center', flexWrap:'wrap' }}>
          <button className="home-btn" onClick={() => setPage('user-select')} style={{
            background:'linear-gradient(135deg, #6366f1, #818cf8)',
            color:'white', borderRadius:'16px',
            padding:'16px 36px', fontSize:'1rem',
            fontFamily:"'DM Sans', sans-serif", fontWeight:'500',
            boxShadow:'0 8px 32px rgba(99,102,241,0.35)',
          }}>
            👤 Isi Pertanyaan
          </button>
          <button className="home-btn" onClick={() => setPage('admin-login')} style={{
            background:'rgba(255,255,255,0.05)',
            border:'1px solid rgba(255,255,255,0.15)',
            color:'#d1d5db', borderRadius:'16px',
            padding:'16px 36px', fontSize:'1rem',
            fontFamily:"'DM Sans', sans-serif", fontWeight:'500',
          }}>
            🔐 Admin
          </button>
        </div>
      </div>
    </div>
  )
}
