import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function UserSelect({ onSelect, onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('users').select('*').order('name').then(({ data }) => {
      if (data) setUsers(data)
      setLoading(false)
    })
  }, [])

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#0a0a0f,#111827,#0a0a0f)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'DM Sans',sans-serif", padding:'24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes stagger{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        .user-card{transition:all .2s;cursor:pointer;border:1px solid rgba(255,255,255,0.08)!important;}
        .user-card:hover{transform:translateY(-3px);border-color:#6366f1!important;box-shadow:0 8px 28px rgba(99,102,241,0.25)!important;background:rgba(99,102,241,0.1)!important;}
      `}</style>
      <div style={{ width:'100%', maxWidth:'480px', animation:'fadeUp .5s ease' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:'0.85rem', marginBottom:'28px', padding:0 }}>← Kembali</button>

        <h2 style={{ fontFamily:"'Playfair Display',serif", color:'white', fontSize:'2rem', marginBottom:'8px' }}>Halo! 👋</h2>
        <p style={{ color:'#6b7280', fontSize:'0.9rem', marginBottom:'32px' }}>Pilih namamu untuk mulai mengisi pertanyaan</p>

        {loading && <p style={{ color:'#4b5563', textAlign:'center' }}>Memuat...</p>}

        {!loading && users.length === 0 && (
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'32px', textAlign:'center' }}>
            <p style={{ color:'#6b7280' }}>Belum ada user terdaftar.<br/>Hubungi admin.</p>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {users.map((u, i) => (
            <div key={u.id} className="user-card" onClick={() => onSelect(u)} style={{
              background:'rgba(255,255,255,0.04)',
              borderRadius:'14px', padding:'18px 20px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              animation:`stagger .4s ease ${i*0.07}s both`,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                <div style={{
                  width:42, height:42, borderRadius:'50%',
                  background:'linear-gradient(135deg,#6366f1,#818cf8)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1.1rem', fontWeight:'700', color:'white',
                }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ color:'#e5e7eb', fontWeight:'500', fontSize:'0.95rem' }}>{u.name}</span>
              </div>
              <span style={{ color:'#4b5563', fontSize:'1rem' }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
