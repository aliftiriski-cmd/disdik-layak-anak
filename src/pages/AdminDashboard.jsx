import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const S = {
  page: { minHeight:'100vh', background:'#0a0a0f', fontFamily:"'DM Sans',sans-serif", color:'white' },
  nav: { background:'rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  container: { maxWidth:1100, margin:'0 auto', padding:'32px 24px' },
  card: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'24px' },
  input: { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', padding:'11px 14px', color:'white', fontSize:'0.9rem', outline:'none' },
  label: { color:'#9ca3af', fontSize:'0.75rem', letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:'6px' },
  btn: { cursor:'pointer', border:'none', borderRadius:'10px', padding:'10px 20px', fontSize:'0.85rem', fontWeight:'500', transition:'all .2s' },
}

function Toggle({ label, desc, checked, onChange, color='#6366f1' }) {
  return (
    <div onClick={onChange} style={{ display:'flex', alignItems:'flex-start', gap:'12px', cursor:'pointer', background: checked ? `rgba(99,102,241,0.08)` : 'rgba(255,255,255,0.03)', border: `1px solid ${checked ? color+'66' : 'rgba(255,255,255,0.08)'}`, borderRadius:'12px', padding:'14px 16px', transition:'all .2s', userSelect:'none' }}>
      <div style={{ width:20, height:20, borderRadius:'6px', border: `2px solid ${checked ? color : 'rgba(255,255,255,0.2)'}`, background: checked ? color : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px', transition:'all .2s' }}>
        {checked && <span style={{ color:'white', fontSize:'11px', fontWeight:'bold' }}>✓</span>}
      </div>
      <div>
        <div style={{ color:'#e5e7eb', fontSize:'0.88rem', fontWeight:'500' }}>{label}</div>
        {desc && <div style={{ color:'#6b7280', fontSize:'0.75rem', marginTop:'2px' }}>{desc}</div>}
      </div>
    </div>
  )
}

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [newUserName, setNewUserName] = useState('')

  // Question form — feature flags
  const [qText, setQText]             = useState('')
  const [qClue, setQClue]             = useState('')
  const [qHasChoices, setQHasChoices] = useState(true)
  const [qHasUpload, setQHasUpload]   = useState(false)
  const [qHasMatrix, setQHasMatrix]   = useState(false)
  const [qOptions, setQOptions]       = useState(['','','',''])
  const [qMultiFiles, setQMultiFiles] = useState(false)
  const [qMatrixRows, setQMatrixRows] = useState(['',''])
  const [qMatrixCols, setQMatrixCols] = useState(['',''])
  const [qAssignedUsers, setQAssignedUsers] = useState([])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [u, q, a] = await Promise.all([
      supabase.from('users').select('*').order('created_at'),
      supabase.from('questions').select('*, question_assignments(user_id)').order('created_at'),
      supabase.from('answers').select('*, users(name), questions(text,type,options,matrix_config)').order('updated_at', { ascending: false }),
    ])
    if (u.data) setUsers(u.data)
    if (q.data) setQuestions(q.data)
    if (a.data) setAnswers(a.data)
    setLoading(false)
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function addUser() {
    if (!newUserName.trim()) return
    const { error } = await supabase.from('users').insert({ name: newUserName.trim() })
    if (!error) { setNewUserName(''); fetchAll(); flash('User ditambahkan! ✅') }
  }

  async function deleteUser(id) {
    if (!window.confirm('Hapus user ini?')) return
    await supabase.from('users').delete().eq('id', id)
    fetchAll(); flash('User dihapus!')
  }

  async function addQuestion() {
    if (!qText.trim()) return
    if (!qHasChoices && !qHasUpload && !qHasMatrix) { flash('⚠️ Pilih minimal satu fitur!'); return }
    const parts = []
    if (qHasChoices) parts.push('choices')
    if (qHasUpload)  parts.push('upload')
    if (qHasMatrix)  parts.push('matrix')
    const type = parts.join('+')
    const payload = {
      text: qText.trim(), clue: qClue.trim() || null, type,
      options: qHasChoices ? qOptions.filter(o=>o.trim()) : null,
      matrix_config: qHasMatrix ? { rows: qMatrixRows.filter(r=>r.trim()), cols: qMatrixCols.filter(c=>c.trim()) } : null,
      allow_multiple_files: qHasUpload ? qMultiFiles : false,
    }
    const { data, error } = await supabase.from('questions').insert(payload).select().single()
    if (error || !data) { flash('❌ Gagal menyimpan'); return }
    if (qAssignedUsers.length > 0) {
      await supabase.from('question_assignments').insert(qAssignedUsers.map(uid => ({ question_id: data.id, user_id: uid })))
    }
    setQText(''); setQClue(''); setQHasChoices(true); setQHasUpload(false); setQHasMatrix(false)
    setQOptions(['','','','']); setQMultiFiles(false); setQMatrixRows(['','']); setQMatrixCols(['','']); setQAssignedUsers([])
    fetchAll(); flash('Pertanyaan ditambahkan! ✅')
  }

  async function deleteQuestion(id) {
    if (!window.confirm('Hapus pertanyaan ini?')) return
    await supabase.from('questions').delete().eq('id', id)
    fetchAll(); flash('Pertanyaan dihapus!')
  }

  function exportCSV() {
    const rows = [['User','Pertanyaan','Fitur','Jawaban Pilihan','Matriks','File','Waktu']]
    answers.forEach(a => {
      rows.push([
        a.users?.name||'-', a.questions?.text||'-', a.questions?.type||'-',
        a.answer_text||'-',
        a.answer_matrix ? JSON.stringify(a.answer_matrix) : '-',
        a.file_urls?.join(', ')||'-',
        new Date(a.updated_at).toLocaleString('id-ID'),
      ])
    })
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff'+csv], { type:'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='rekap-jawaban.csv'; a.click()
  }

  const typeChips = (type='') => {
    const map = { choices:{ label:'📋 Pilihan Ganda', color:'#a5b4fc', bg:'rgba(99,102,241,0.15)' }, upload:{ label:'📎 Upload File', color:'#7dd3fc', bg:'rgba(14,165,233,0.15)' }, matrix:{ label:'📊 Matriks', color:'#6ee7b7', bg:'rgba(16,185,129,0.15)' } }
    return type.split('+').map(t => map[t]).filter(Boolean)
  }

  const tabs = [{ id:'users', label:'👤 Kelola User' },{ id:'questions', label:'📝 Kelola Pertanyaan' },{ id:'recap', label:'📊 Rekap Jawaban' }]

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;}
        input,select,textarea{font-family:'DM Sans',sans-serif;}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.15)!important;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .row-hover:hover{background:rgba(255,255,255,0.04)!important;}
        .tab-btn:hover{background:rgba(255,255,255,0.06)!important;}
        .del-btn:hover{background:rgba(239,68,68,0.2)!important;color:#f87171!important;}
        .sec-hd{font-size:.7rem;color:#6b7280;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06);}
      `}</style>

      <div style={S.nav}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'1.3rem' }}>⚙️</span>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem' }}>Admin Dashboard</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          {msg && <span style={{ color:'#86efac', fontSize:'0.82rem', animation:'fadeUp .3s ease' }}>{msg}</span>}
          <button onClick={onLogout} style={{ ...S.btn, background:'rgba(239,68,68,0.15)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.3)' }}>Logout</button>
        </div>
      </div>

      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'0 32px', display:'flex', gap:'4px' }}>
        {tabs.map(t => (
          <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)} style={{ ...S.btn, borderRadius:'0', padding:'14px 20px', background:tab===t.id?'rgba(99,102,241,0.12)':'transparent', color:tab===t.id?'#a5b4fc':'#6b7280', borderBottom:tab===t.id?'2px solid #6366f1':'2px solid transparent', fontSize:'0.88rem' }}>{t.label}</button>
        ))}
      </div>

      <div style={S.container}>
        {loading && <p style={{ color:'#6b7280', textAlign:'center', padding:'32px' }}>Memuat data...</p>}

        {/* USERS */}
        {tab==='users' && (
          <div style={{ animation:'fadeUp .4s ease' }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", marginBottom:'24px', fontSize:'1.4rem' }}>Kelola User</h2>
            <div style={{ ...S.card, marginBottom:'20px' }}>
              <p style={S.label}>Tambah User Baru</p>
              <div style={{ display:'flex', gap:'12px' }}>
                <input style={S.input} value={newUserName} onChange={e=>setNewUserName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addUser()} placeholder="Nama user..." />
                <button onClick={addUser} style={{ ...S.btn, background:'linear-gradient(135deg,#6366f1,#818cf8)', color:'white', whiteSpace:'nowrap', padding:'11px 24px' }}>+ Tambah</button>
              </div>
            </div>
            <div style={S.card}>
              <p style={{ ...S.label, marginBottom:'16px' }}>Daftar User ({users.length})</p>
              {users.length===0 && <p style={{ color:'#4b5563', fontSize:'0.85rem' }}>Belum ada user.</p>}
              {users.map(u => (
                <div key={u.id} className="row-hover" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 10px', borderRadius:'10px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:'700', color:'white' }}>{u.name.charAt(0).toUpperCase()}</div>
                    <span style={{ fontWeight:'500', color:'#e5e7eb' }}>{u.name}</span>
                  </div>
                  <button className="del-btn" onClick={()=>deleteUser(u.id)} style={{ ...S.btn, background:'rgba(239,68,68,0.1)', color:'#f87171', fontSize:'0.78rem', padding:'6px 14px' }}>Hapus</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUESTIONS */}
        {tab==='questions' && (
          <div style={{ animation:'fadeUp .4s ease' }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", marginBottom:'24px', fontSize:'1.4rem' }}>Kelola Pertanyaan</h2>
            <div style={{ ...S.card, marginBottom:'24px' }}>
              <p style={{ fontWeight:'600', color:'#e5e7eb', marginBottom:'20px' }}>✏️ Buat Pertanyaan Baru</p>

              <div style={{ marginBottom:'16px' }}>
                <label style={S.label}>Teks Pertanyaan *</label>
                <textarea value={qText} onChange={e=>setQText(e.target.value)} rows={2} placeholder="Tulis pertanyaan di sini..." style={{ ...S.input, resize:'vertical', lineHeight:1.6 }} />
              </div>
              <div style={{ marginBottom:'24px' }}>
                <label style={S.label}>Clue / Petunjuk (opsional)</label>
                <input style={S.input} value={qClue} onChange={e=>setQClue(e.target.value)} placeholder="Contoh: Pilih jawaban yang paling tepat..." />
              </div>

              <p className="sec-hd">Fitur Pertanyaan — bisa pilih lebih dari satu</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'24px' }}>
                <Toggle label="📋 Pilihan Ganda" desc="User memilih dari opsi yang tersedia" checked={qHasChoices} onChange={()=>setQHasChoices(v=>!v)} color="#6366f1" />
                <Toggle label="📎 Upload File" desc="User melampirkan file sebagai jawaban" checked={qHasUpload} onChange={()=>setQHasUpload(v=>!v)} color="#0ea5e9" />
                <Toggle label="📊 Matriks Tabel" desc="User mengisi data dalam bentuk tabel" checked={qHasMatrix} onChange={()=>setQHasMatrix(v=>!v)} color="#10b981" />
              </div>

              {qHasChoices && (
                <div style={{ marginBottom:'20px', padding:'16px', background:'rgba(99,102,241,0.06)', borderRadius:'12px', border:'1px solid rgba(99,102,241,0.15)' }}>
                  <p className="sec-hd" style={{ color:'#a5b4fc', borderBottomColor:'rgba(99,102,241,0.2)' }}>Opsi Pilihan Ganda</p>
                  {qOptions.map((opt,i) => (
                    <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'8px', alignItems:'center' }}>
                      <span style={{ color:'#6b7280', fontSize:'0.85rem', minWidth:'22px', fontWeight:'600' }}>{String.fromCharCode(65+i)}.</span>
                      <input style={S.input} value={opt} onChange={e=>{ const o=[...qOptions]; o[i]=e.target.value; setQOptions(o) }} placeholder={`Pilihan ${String.fromCharCode(65+i)}`} />
                      {qOptions.length>2 && <button onClick={()=>setQOptions(qOptions.filter((_,j)=>j!==i))} style={{ ...S.btn, padding:'8px 12px', background:'rgba(239,68,68,0.1)', color:'#f87171' }}>✕</button>}
                    </div>
                  ))}
                  {qOptions.length<6 && <button onClick={()=>setQOptions([...qOptions,''])} style={{ ...S.btn, background:'rgba(255,255,255,0.06)', color:'#9ca3af', fontSize:'0.8rem', marginTop:'4px' }}>+ Tambah Pilihan</button>}
                </div>
              )}

              {qHasUpload && (
                <div style={{ marginBottom:'20px', padding:'16px', background:'rgba(14,165,233,0.06)', borderRadius:'12px', border:'1px solid rgba(14,165,233,0.15)' }}>
                  <p className="sec-hd" style={{ color:'#7dd3fc', borderBottomColor:'rgba(14,165,233,0.2)' }}>Pengaturan Upload File</p>
                  <Toggle label="Izinkan upload lebih dari satu file" checked={qMultiFiles} onChange={()=>setQMultiFiles(v=>!v)} color="#0ea5e9" />
                </div>
              )}

              {qHasMatrix && (
                <div style={{ marginBottom:'20px', padding:'16px', background:'rgba(16,185,129,0.06)', borderRadius:'12px', border:'1px solid rgba(16,185,129,0.15)' }}>
                  <p className="sec-hd" style={{ color:'#6ee7b7', borderBottomColor:'rgba(16,185,129,0.2)' }}>Konfigurasi Matriks</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                    <div>
                      <label style={{ ...S.label, color:'#6ee7b7' }}>Baris (Row)</label>
                      {qMatrixRows.map((r,i) => (
                        <div key={i} style={{ display:'flex', gap:'6px', marginBottom:'6px' }}>
                          <input style={S.input} value={r} onChange={e=>{ const rows=[...qMatrixRows]; rows[i]=e.target.value; setQMatrixRows(rows) }} placeholder={`Baris ${i+1}`} />
                          {qMatrixRows.length>1 && <button onClick={()=>setQMatrixRows(qMatrixRows.filter((_,j)=>j!==i))} style={{ ...S.btn, padding:'8px', background:'rgba(239,68,68,0.1)', color:'#f87171' }}>✕</button>}
                        </div>
                      ))}
                      <button onClick={()=>setQMatrixRows([...qMatrixRows,''])} style={{ ...S.btn, background:'rgba(255,255,255,0.06)', color:'#9ca3af', fontSize:'0.78rem' }}>+ Baris</button>
                    </div>
                    <div>
                      <label style={{ ...S.label, color:'#6ee7b7' }}>Kolom (Column)</label>
                      {qMatrixCols.map((c,i) => (
                        <div key={i} style={{ display:'flex', gap:'6px', marginBottom:'6px' }}>
                          <input style={S.input} value={c} onChange={e=>{ const cols=[...qMatrixCols]; cols[i]=e.target.value; setQMatrixCols(cols) }} placeholder={`Kolom ${i+1}`} />
                          {qMatrixCols.length>1 && <button onClick={()=>setQMatrixCols(qMatrixCols.filter((_,j)=>j!==i))} style={{ ...S.btn, padding:'8px', background:'rgba(239,68,68,0.1)', color:'#f87171' }}>✕</button>}
                        </div>
                      ))}
                      <button onClick={()=>setQMatrixCols([...qMatrixCols,''])} style={{ ...S.btn, background:'rgba(255,255,255,0.06)', color:'#9ca3af', fontSize:'0.78rem' }}>+ Kolom</button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom:'24px' }}>
                <label style={S.label}>Assign ke User (kosongkan = semua user)</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'6px' }}>
                  {users.map(u => (
                    <div key={u.id} onClick={()=>{ if(qAssignedUsers.includes(u.id)) setQAssignedUsers(qAssignedUsers.filter(id=>id!==u.id)); else setQAssignedUsers([...qAssignedUsers,u.id]) }} style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', background:qAssignedUsers.includes(u.id)?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.04)', border:qAssignedUsers.includes(u.id)?'1px solid #6366f1':'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'6px 12px', transition:'all .2s', userSelect:'none' }}>
                      <span style={{ fontSize:'0.82rem', color:qAssignedUsers.includes(u.id)?'#a5b4fc':'#9ca3af' }}>👤 {u.name}</span>
                    </div>
                  ))}
                  {users.length===0 && <p style={{ color:'#4b5563', fontSize:'0.82rem' }}>Tambah user dulu di tab User.</p>}
                </div>
              </div>

              <button onClick={addQuestion} style={{ ...S.btn, background:'linear-gradient(135deg,#6366f1,#818cf8)', color:'white', padding:'12px 28px', fontSize:'0.9rem' }}>+ Simpan Pertanyaan</button>
            </div>

            <div style={S.card}>
              <p style={{ ...S.label, marginBottom:'16px' }}>Daftar Pertanyaan ({questions.length})</p>
              {questions.length===0 && <p style={{ color:'#4b5563', fontSize:'0.85rem' }}>Belum ada pertanyaan.</p>}
              {questions.map((q,i) => {
                const assigned = q.question_assignments?.map(a=>users.find(u=>u.id===a.user_id)?.name).filter(Boolean)
                const chips = typeChips(q.type)
                return (
                  <div key={q.id} className="row-hover" style={{ padding:'14px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)', borderRadius:'10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px', flexWrap:'wrap' }}>
                          <span style={{ color:'#4b5563', fontSize:'0.78rem' }}>#{i+1}</span>
                          {chips.map((c,ci) => <span key={ci} style={{ background:c.bg, color:c.color, borderRadius:'6px', padding:'2px 8px', fontSize:'0.7rem' }}>{c.label}</span>)}
                          {q.allow_multiple_files && <span style={{ background:'rgba(14,165,233,0.1)', color:'#7dd3fc', borderRadius:'6px', padding:'2px 8px', fontSize:'0.7rem' }}>multi-file</span>}
                        </div>
                        <p style={{ color:'#e5e7eb', fontSize:'0.9rem', marginBottom:'4px' }}>{q.text}</p>
                        {q.clue && <p style={{ color:'#6b7280', fontSize:'0.78rem', fontStyle:'italic' }}>💡 {q.clue}</p>}
                        <p style={{ color:'#4b5563', fontSize:'0.72rem', marginTop:'6px' }}>{assigned?.length>0?`👤 ${assigned.join(', ')}`:'👥 Semua user'}</p>
                      </div>
                      <button className="del-btn" onClick={()=>deleteQuestion(q.id)} style={{ ...S.btn, background:'rgba(239,68,68,0.1)', color:'#f87171', fontSize:'0.78rem', padding:'6px 14px', whiteSpace:'nowrap' }}>Hapus</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* RECAP */}
        {tab==='recap' && (
          <div style={{ animation:'fadeUp .4s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.4rem' }}>Rekap Jawaban</h2>
              <button onClick={exportCSV} style={{ ...S.btn, background:'linear-gradient(135deg,#059669,#10b981)', color:'white', padding:'10px 22px' }}>⬇️ Export CSV</button>
            </div>
            {answers.length===0 && <div style={{ ...S.card, textAlign:'center', padding:'48px' }}><p style={{ color:'#4b5563' }}>Belum ada jawaban masuk.</p></div>}
            {users.map(u => {
              const ua = answers.filter(a=>a.user_id===u.id)
              if (ua.length===0) return null
              return (
                <div key={u.id} style={{ ...S.card, marginBottom:'20px' }}>
                  <p style={{ fontWeight:'600', color:'#a5b4fc', marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#818cf8)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.82rem', fontWeight:'700' }}>{u.name.charAt(0).toUpperCase()}</span>
                    {u.name}
                  </p>
                  {ua.map(a => (
                    <div key={a.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:'14px', marginBottom:'14px' }}>
                      <p style={{ color:'#6b7280', fontSize:'0.75rem', marginBottom:'8px' }}>{a.questions?.text}</p>
                      {a.answer_text && <div style={{ background:'rgba(99,102,241,0.08)', borderRadius:'8px', padding:'8px 12px', marginBottom:'8px' }}><p style={{ color:'#a5b4fc', fontSize:'0.7rem', marginBottom:'2px' }}>📋 Pilihan</p><p style={{ color:'#e5e7eb', fontSize:'0.88rem' }}>{a.answer_text}</p></div>}
                      {a.answer_matrix && (
                        <div style={{ overflowX:'auto', marginBottom:'8px' }}>
                          <p style={{ color:'#6ee7b7', fontSize:'0.7rem', marginBottom:'6px' }}>📊 Matriks</p>
                          <table style={{ borderCollapse:'collapse', fontSize:'0.78rem' }}>
                            <thead><tr>
                              <th style={{ padding:'6px 10px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(255,255,255,0.08)', color:'#6ee7b7' }}></th>
                              {a.answer_matrix.cols?.map((c,i)=><th key={i} style={{ padding:'6px 10px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(255,255,255,0.08)', color:'#6ee7b7', whiteSpace:'nowrap' }}>{c}</th>)}
                            </tr></thead>
                            <tbody>{a.answer_matrix.rows?.map((r,ri)=>(
                              <tr key={ri}>
                                <td style={{ padding:'6px 10px', border:'1px solid rgba(255,255,255,0.08)', color:'#9ca3af', fontWeight:'500', whiteSpace:'nowrap' }}>{r}</td>
                                {a.answer_matrix.cols?.map((_,ci)=><td key={ci} style={{ padding:'6px 10px', border:'1px solid rgba(255,255,255,0.08)', color:'#e5e7eb', textAlign:'center' }}>{a.answer_matrix.values?.[ri]?.[ci]||'-'}</td>)}
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      )}
                      {a.file_urls?.length>0 && (
                        <div><p style={{ color:'#7dd3fc', fontSize:'0.7rem', marginBottom:'6px' }}>📎 File</p>
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                          {a.file_urls.map((url,i)=><a key={i} href={url} target="_blank" rel="noreferrer" style={{ color:'#60a5fa', fontSize:'0.8rem', textDecoration:'none', background:'rgba(96,165,250,0.1)', padding:'4px 10px', borderRadius:'6px', border:'1px solid rgba(96,165,250,0.25)' }}>📎 File {i+1}</a>)}
                        </div></div>
                      )}
                      <p style={{ color:'#374151', fontSize:'0.68rem', marginTop:'8px' }}>{new Date(a.updated_at).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
