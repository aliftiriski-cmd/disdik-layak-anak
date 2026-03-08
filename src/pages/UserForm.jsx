import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const S = {
  page: { minHeight:'100vh', background:'linear-gradient(135deg,#0a0a0f,#111827,#0a0a0f)', fontFamily:"'DM Sans',sans-serif", color:'white', padding:'24px' },
  container: { maxWidth:720, margin:'0 auto' },
  card: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'24px', marginBottom:'16px' },
  input: { width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', padding:'11px 14px', color:'white', fontSize:'0.9rem', outline:'none', fontFamily:"'DM Sans',sans-serif" },
  sectionTitle: { fontSize:'0.7rem', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'10px', paddingBottom:'8px', borderBottom:'1px solid rgba(255,255,255,0.06)' },
}

export default function UserForm({ user, onBack }) {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { fetchQuestions() }, [])

  async function fetchQuestions() {
    const { data: assigned } = await supabase.from('question_assignments').select('question_id').eq('user_id', user.id)
    const { data: allQ } = await supabase.from('questions').select('*').order('created_at')
    const { data: globalAssign } = await supabase.from('question_assignments').select('question_id')
    const assignedIds = assigned?.map(a=>a.question_id) || []
    const allAssignedIds = [...new Set(globalAssign?.map(a=>a.question_id)||[])]
    const filtered = allQ?.filter(q => assignedIds.includes(q.id) || !allAssignedIds.includes(q.id)) || []
    setQuestions(filtered)

    const { data: existing } = await supabase.from('answers').select('*').eq('user_id', user.id)
    if (existing) {
      const map = {}
      existing.forEach(a => { map[a.question_id] = { id:a.id, text:a.answer_text||'', matrix:a.answer_matrix||null, files:a.file_urls||[] } })
      setAnswers(map)
    }
    setLoading(false)
  }

  function updateAnswer(qId, patch) {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], ...patch } }))
    setSaved(prev => ({ ...prev, [qId]: false }))
  }

  async function saveAnswer(q) {
    setSaving(prev => ({ ...prev, [q.id]: true }))
    const cur = answers[q.id] || {}
    const payload = { user_id:user.id, question_id:q.id, answer_text:cur.text||null, answer_matrix:cur.matrix||null, file_urls:cur.files||[], updated_at:new Date().toISOString() }
    if (cur.id) {
      await supabase.from('answers').update(payload).eq('id', cur.id)
    } else {
      const { data } = await supabase.from('answers').insert(payload).select().single()
      if (data) updateAnswer(q.id, { id:data.id })
    }
    setSaving(prev => ({ ...prev, [q.id]: false }))
    setSaved(prev => ({ ...prev, [q.id]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [q.id]: false })), 2200)
  }

  async function uploadFiles(qId, files, allowMulti) {
    const urls = []
    const toUpload = allowMulti ? Array.from(files) : [files[0]]
    for (const file of toUpload) {
      const filename = `${user.id}/${qId}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from('answer-files').upload(filename, file)
      if (!error && data) {
        const { data: ud } = supabase.storage.from('answer-files').getPublicUrl(filename)
        urls.push(ud.publicUrl)
      }
    }
    const existing = allowMulti ? (answers[qId]?.files||[]) : []
    updateAnswer(qId, { files: [...existing, ...urls] })
  }

  function removeFile(qId, idx) {
    const files = [...(answers[qId]?.files||[])]
    files.splice(idx, 1)
    updateAnswer(qId, { files })
  }

  function initMatrix(q) {
    if (answers[q.id]?.matrix) return
    const cfg = q.matrix_config
    if (!cfg) return
    const values = cfg.rows.map(()=>cfg.cols.map(()=>''))
    updateAnswer(q.id, { matrix:{ rows:cfg.rows, cols:cfg.cols, values } })
  }

  const hasFeature = (type='', feat) => type.split('+').includes(feat)

  if (submitted) {
    return (
      <div style={{ ...S.page, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap'); @keyframes pop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
        <div style={{ textAlign:'center', animation:'pop .5s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ fontSize:'4rem', marginBottom:'16px' }}>🎉</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', marginBottom:'8px' }}>Terima kasih, {user.name}!</h2>
          <p style={{ color:'#6b7280', marginBottom:'28px' }}>Semua jawaban sudah tersimpan. Kamu bisa kembali untuk mengedit kapan saja.</p>
          <button onClick={onBack} style={{ background:'linear-gradient(135deg,#6366f1,#818cf8)', border:'none', borderRadius:'12px', padding:'14px 28px', color:'white', fontSize:'0.95rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>← Kembali ke Pilih User</button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;}
        input:focus,textarea:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.15)!important;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .opt-label:hover{border-color:#6366f1!important;background:rgba(99,102,241,0.08)!important;}
        .file-drop:hover{border-color:#0ea5e9!important;background:rgba(14,165,233,0.06)!important;}
        .save-btn:hover{filter:brightness(1.1);}
      `}</style>

      <div style={S.container}>
        <div style={{ marginBottom:'32px' }}>
          <button onClick={onBack} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:'0.85rem', padding:0, display:'block', marginBottom:'8px' }}>← Ganti User</button>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', margin:0 }}>Halo, {user.name}! 👋</h2>
          <p style={{ color:'#6b7280', fontSize:'0.85rem', marginTop:'4px' }}>{questions.length} pertanyaan untukmu • Simpan tiap jawaban sebelum lanjut</p>
        </div>

        {loading && <p style={{ color:'#4b5563', textAlign:'center' }}>Memuat pertanyaan...</p>}
        {!loading && questions.length===0 && <div style={{ ...S.card, textAlign:'center', padding:'48px' }}><p style={{ color:'#6b7280' }}>Belum ada pertanyaan untukmu. Cek lagi nanti! 😊</p></div>}

        {questions.map((q,i) => {
          const ans = answers[q.id] || {}
          const type = q.type || ''
          const hasChoices = hasFeature(type,'choices')
          const hasUpload  = hasFeature(type,'upload')
          const hasMatrix  = hasFeature(type,'matrix')
          const isSaving = saving[q.id]
          const isSaved  = saved[q.id]

          // Chip styles
          const chips = []
          if (hasChoices) chips.push({ label:'📋 Pilihan Ganda', color:'#a5b4fc', bg:'rgba(99,102,241,0.12)' })
          if (hasUpload)  chips.push({ label:'📎 Upload File',   color:'#7dd3fc', bg:'rgba(14,165,233,0.12)' })
          if (hasMatrix)  chips.push({ label:'📊 Matriks Tabel', color:'#6ee7b7', bg:'rgba(16,185,129,0.12)' })

          return (
            <div key={q.id} style={{ ...S.card, animation:`fadeUp .4s ease ${i*0.06}s both` }}>
              {/* Header */}
              <div style={{ marginBottom:'14px' }}>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'8px' }}>
                  <span style={{ color:'#4b5563', fontSize:'0.78rem', marginRight:'2px' }}>#{i+1}</span>
                  {chips.map((c,ci) => <span key={ci} style={{ background:c.bg, color:c.color, borderRadius:'6px', padding:'2px 8px', fontSize:'0.7rem' }}>{c.label}</span>)}
                </div>
                <p style={{ color:'#e5e7eb', fontSize:'0.95rem', lineHeight:1.6, fontWeight:'500', margin:0 }}>{q.text}</p>
                {q.clue && (
                  <div style={{ marginTop:'10px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'8px', padding:'8px 12px', display:'flex', gap:'8px' }}>
                    <span>💡</span>
                    <p style={{ color:'#fcd34d', fontSize:'0.8rem', fontStyle:'italic', lineHeight:1.5, margin:0 }}>{q.clue}</p>
                  </div>
                )}
              </div>

              {/* ── PILIHAN GANDA ── */}
              {hasChoices && (
                <div style={{ marginBottom: (hasUpload||hasMatrix) ? '20px' : '0' }}>
                  {(hasUpload||hasMatrix) && <p style={S.sectionTitle}>📋 Pilihan Ganda</p>}
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {(q.options||[]).map((opt,oi) => (
                      <label key={oi} className="opt-label" style={{ display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', background:ans.text===opt?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.03)', border:ans.text===opt?'1px solid #6366f1':'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'12px 16px', transition:'all .2s' }}>
                        <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0, border:ans.text===opt?'5px solid #6366f1':'2px solid rgba(255,255,255,0.2)', transition:'all .2s' }}/>
                        <input type="radio" value={opt} checked={ans.text===opt} onChange={()=>updateAnswer(q.id,{text:opt})} style={{ display:'none' }} />
                        <span style={{ color:ans.text===opt?'#e5e7eb':'#9ca3af', fontSize:'0.88rem' }}>
                          <strong style={{ color:ans.text===opt?'#a5b4fc':'#4b5563', marginRight:'6px' }}>{String.fromCharCode(65+oi)}.</strong>{opt}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ── UPLOAD FILE ── */}
              {hasUpload && (
                <div style={{ marginBottom: hasMatrix ? '20px' : '0' }}>
                  {(hasChoices||hasMatrix) && <p style={S.sectionTitle}>📎 Upload File</p>}
                  <label className="file-drop" style={{ display:'block', border:'2px dashed rgba(14,165,233,0.3)', borderRadius:'12px', padding:'20px', textAlign:'center', cursor:'pointer', transition:'all .2s' }}>
                    <input type="file" multiple={q.allow_multiple_files} style={{ display:'none' }} onChange={e=>uploadFiles(q.id, e.target.files, q.allow_multiple_files)} />
                    <div style={{ fontSize:'1.8rem', marginBottom:'6px' }}>📎</div>
                    <p style={{ color:'#6b7280', fontSize:'0.82rem' }}>{q.allow_multiple_files?'Klik untuk upload satu atau lebih file':'Klik untuk upload file'}</p>
                  </label>
                  {(ans.files||[]).length>0 && (
                    <div style={{ marginTop:'10px', display:'flex', flexDirection:'column', gap:'6px' }}>
                      {ans.files.map((url,fi) => {
                        const name = decodeURIComponent(url.split('/').pop().split('-').slice(1).join('-'))||`File ${fi+1}`
                        return (
                          <div key={fi} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:'8px', padding:'8px 12px' }}>
                            <a href={url} target="_blank" rel="noreferrer" style={{ color:'#7dd3fc', fontSize:'0.8rem', textDecoration:'none' }}>📎 {name}</a>
                            <button onClick={()=>removeFile(q.id,fi)} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:'0.8rem', padding:'2px 6px' }}>✕</button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── MATRIKS ── */}
              {hasMatrix && (() => {
                if (!ans.matrix) initMatrix(q)
                const mx = ans.matrix
                if (!mx) return null
                return (
                  <div>
                    {(hasChoices||hasUpload) && <p style={S.sectionTitle}>📊 Matriks Tabel</p>}
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ borderCollapse:'collapse', width:'100%', fontSize:'0.82rem' }}>
                        <thead>
                          <tr>
                            <th style={{ padding:'9px 12px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(255,255,255,0.08)', color:'#6ee7b7', textAlign:'left', minWidth:'110px' }}></th>
                            {mx.cols?.map((c,ci) => <th key={ci} style={{ padding:'9px 12px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(255,255,255,0.08)', color:'#6ee7b7', textAlign:'center', minWidth:'90px', whiteSpace:'nowrap' }}>{c}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {mx.rows?.map((r,ri) => (
                            <tr key={ri}>
                              <td style={{ padding:'8px 12px', border:'1px solid rgba(255,255,255,0.08)', color:'#9ca3af', fontWeight:'500', background:'rgba(255,255,255,0.02)', whiteSpace:'nowrap' }}>{r}</td>
                              {mx.cols?.map((_,ci) => (
                                <td key={ci} style={{ border:'1px solid rgba(255,255,255,0.08)', padding:'3px' }}>
                                  <input style={{ ...S.input, padding:'8px', textAlign:'center', background:'transparent', border:'none' }}
                                    value={mx.values?.[ri]?.[ci]||''}
                                    onChange={e=>{ const nv=mx.values.map(row=>[...row]); nv[ri][ci]=e.target.value; updateAnswer(q.id,{matrix:{...mx,values:nv}}) }}
                                    placeholder="..." />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}

              {/* Save */}
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'16px' }}>
                <button className="save-btn" onClick={()=>saveAnswer(q)} disabled={isSaving} style={{ background:isSaved?'linear-gradient(135deg,#059669,#10b981)':'linear-gradient(135deg,#6366f1,#818cf8)', border:'none', borderRadius:'10px', padding:'10px 22px', color:'white', fontSize:'0.82rem', cursor:'pointer', transition:'all .3s', opacity:isSaving?0.7:1 }}>
                  {isSaving?'Menyimpan...':isSaved?'✅ Tersimpan!':'💾 Simpan Jawaban'}
                </button>
              </div>
            </div>
          )
        })}

        {!loading && questions.length>0 && (
          <div style={{ textAlign:'center', padding:'24px 0 48px' }}>
            <button onClick={()=>setSubmitted(true)} style={{ background:'linear-gradient(135deg,#6366f1,#818cf8)', border:'none', borderRadius:'14px', padding:'16px 40px', color:'white', fontSize:'1rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 8px 28px rgba(99,102,241,0.35)' }}>
              🎉 Selesai & Submit
            </button>
            <p style={{ color:'#4b5563', fontSize:'0.75rem', marginTop:'10px' }}>Kamu masih bisa edit jawaban setelah submit</p>
          </div>
        )}
      </div>
    </div>
  )
}
