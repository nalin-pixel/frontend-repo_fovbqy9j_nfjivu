import { useEffect, useMemo, useState } from 'react'
import { Play, Star, BookmarkPlus, Search, Film, LogIn, User, Shield } from 'lucide-react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Section({ title, children }) {
  return (
    <section className="max-w-6xl mx-auto px-4 mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function MovieCard({ movie, onPlay, onSave }) {
  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="relative">
        <img src={movie.poster_url} alt={movie.title} className="w-full h-52 object-cover" />
        <button onClick={() => onPlay(movie)} className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 text-white">
          <Play className="w-10 h-10" />
        </button>
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{movie.year}</div>
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Star className="w-3 h-3" /> {movie.avg_rating?.toFixed?.(1) || '0.0'}
        </div>
      </div>
      <div className="p-3">
        <div className="font-medium line-clamp-1">{movie.title}</div>
        <div className="text-xs text-gray-500 line-clamp-1">{movie.genres?.join(', ')}</div>
        <div className="mt-2 flex items-center justify-between">
          <button onClick={() => onPlay(movie)} className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded flex items-center gap-1">
            <Play className="w-4 h-4" /> Tomosha qilish
          </button>
        </div>
      </div>
    </div>
  )
}

function PlayerModal({ open, onClose, movie, onProgress }) {
  const source = movie?.sources?.[0]?.url
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open || !movie) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold">{movie.title}</div>
            <div className="text-xs text-gray-500">{movie.year} • {movie.genres?.join(', ')}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">Yopish</button>
        </div>
        <div className="aspect-video bg-black">
          {source ? (
            <video
              controls
              className="w-full h-full"
              src={source}
              onTimeUpdate={(e) => onProgress?.(Math.floor(e.currentTarget.currentTime))}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">Video manbasi yo'q</div>
          )}
        </div>
        <div className="p-4 text-sm text-gray-700">
          {movie.description}
        </div>
      </div>
    </div>
  )
}

function AdminPanel({ open, onClose, auth, onDataChanged }) {
  const [tab, setTab] = useState('movies')
  const [movies, setMovies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ id: null, title: '', original_title: '', year: 2024, genres: 'Action', poster_url: '', description: '', director: '', cast: '', country: 'UZ', source_url: '' })

  const apiFetch = async (url, options = {}) => {
    const headers = { ...(options.headers || {}), 'Content-Type': 'application/json' }
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`
    const res = await fetch(url, { ...options, headers })
    if (!res.ok) throw new Error(await res.text())
    return res.status === 204 ? null : res.json()
  }

  const loadMovies = async () => {
    const data = await fetch(`${API_BASE}/api/movies?limit=100`).then(r=>r.json())
    setMovies(data)
  }
  const loadUsers = async () => {
    if (!auth) return
    const data = await apiFetch(`${API_BASE}/api/admin/users`)
    setUsers(data)
  }

  useEffect(() => {
    if (open) {
      loadMovies()
      if (auth?.user?.role === 'admin') loadUsers()
    }
  }, [open])

  const resetForm = () => setForm({ id: null, title: '', original_title: '', year: 2024, genres: 'Action', poster_url: '', description: '', director: '', cast: '', country: 'UZ', source_url: '' })

  const submitMovie = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        title: form.title,
        original_title: form.original_title || form.title,
        description: form.description || '',
        year: Number(form.year) || 2024,
        duration_min: 100,
        genres: String(form.genres).split(',').map(s=>s.trim()).filter(Boolean),
        director: form.director || '',
        cast: String(form.cast).split(',').map(s=>s.trim()).filter(Boolean),
        country: form.country || 'UZ',
        poster_url: form.poster_url || 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=800&auto=format&fit=crop',
        trailer_youtube: '',
        sources: [{ label: 'auto', url: form.source_url || 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4' }],
        subtitles: [],
        audio_tracks: ['original'],
        status: 'active',
        imdb_rating: 0,
        avg_rating: 0,
        views: 0,
        tags: [],
      }
      if (form.id) {
        await apiFetch(`${API_BASE}/api/movies/${form.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch(`${API_BASE}/api/movies`, { method: 'POST', body: JSON.stringify(payload) })
      }
      await loadMovies()
      onDataChanged?.()
      resetForm()
      alert('Saqlandi')
    } catch (e) {
      alert('Saqlashda xato: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const editMovie = (m) => {
    setTab('movies')
    setForm({
      id: m.id,
      title: m.title || '',
      original_title: m.original_title || '',
      year: m.year || 2024,
      genres: (m.genres || []).join(', '),
      poster_url: m.poster_url || '',
      description: m.description || '',
      director: m.director || '',
      cast: (m.cast || []).join(', '),
      country: m.country || 'UZ',
      source_url: (m.sources && m.sources[0]?.url) || ''
    })
  }

  const deleteMovie = async (id) => {
    if (!confirm('O‘chirishni tasdiqlaysizmi?')) return
    try {
      await apiFetch(`${API_BASE}/api/movies/${id}`, { method: 'DELETE' })
      await loadMovies()
      onDataChanged?.()
    } catch (e) {
      alert('O‘chirishda xato: ' + e.message)
    }
  }

  const changeRole = async (id, role) => {
    try {
      await apiFetch(`${API_BASE}/api/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) })
      await loadUsers()
      alert('Rol yangilandi')
    } catch (e) {
      alert('Rolni yangilashda xato: ' + e.message)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-6xl h-[80vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="p-4 border-b flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600"/><div className="font-semibold">Admin panel</div></div>
          <div className="flex items-center gap-2 text-sm">
            <button className={`px-3 py-1 rounded ${tab==='movies'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setTab('movies')}>Kontent</button>
            <button className={`px-3 py-1 rounded ${tab==='users'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setTab('users')}>Foydalanuvchilar</button>
            <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100">Yopish</button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3">
          {/* Left: form or list depending on tab */}
          {tab === 'movies' ? (
            <div className="border-r p-4 overflow-y-auto">
              <div className="font-medium mb-3">Film qo‘shish/tahrirlash</div>
              <form onSubmit={submitMovie} className="space-y-2">
                <input className="w-full border px-3 py-2 rounded" placeholder="Sarlavha" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required />
                <input className="w-full border px-3 py-2 rounded" placeholder="Original sarlavha" value={form.original_title} onChange={e=>setForm({...form, original_title: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="w-full border px-3 py-2 rounded" placeholder="Yil" type="number" value={form.year} onChange={e=>setForm({...form, year: e.target.value})} />
                  <input className="w-full border px-3 py-2 rounded" placeholder="Mamlakat" value={form.country} onChange={e=>setForm({...form, country: e.target.value})} />
                </div>
                <input className="w-full border px-3 py-2 rounded" placeholder="Janrlar (vergul bilan)" value={form.genres} onChange={e=>setForm({...form, genres: e.target.value})} />
                <input className="w-full border px-3 py-2 rounded" placeholder="Poster URL" value={form.poster_url} onChange={e=>setForm({...form, poster_url: e.target.value})} />
                <input className="w-full border px-3 py-2 rounded" placeholder="Video URL" value={form.source_url} onChange={e=>setForm({...form, source_url: e.target.value})} />
                <input className="w-full border px-3 py-2 rounded" placeholder="Rejissor" value={form.director} onChange={e=>setForm({...form, director: e.target.value})} />
                <input className="w-full border px-3 py-2 rounded" placeholder="Aktorlar (vergul bilan)" value={form.cast} onChange={e=>setForm({...form, cast: e.target.value})} />
                <textarea className="w-full border px-3 py-2 rounded" rows="3" placeholder="Tavsif" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
                <div className="flex items-center gap-2">
                  <button disabled={loading} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">{form.id ? 'Yangilash' : 'Qo‘shish'}</button>
                  {form.id && (
                    <button type="button" className="px-3 py-2 rounded bg-gray-100" onClick={resetForm}>Bekor qilish</button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="border-r p-4 overflow-y-auto">
              <div className="font-medium mb-3">Foydalanuvchilar</div>
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="font-medium text-sm">{u.name} <span className="text-gray-500">({u.email})</span></div>
                      <div className="text-xs text-gray-500">{u.role}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={u.role} onChange={e=>changeRole(u.id, e.target.value)} className="border rounded px-2 py-1 text-sm">
                        <option value="user">user</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right: list */}
          <div className="col-span-2 p-4 overflow-y-auto">
            {tab === 'movies' ? (
              <div>
                <div className="font-medium mb-3">Filmlar ro‘yxati</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {movies.map(m => (
                    <div key={m.id} className="border rounded overflow-hidden">
                      <div className="flex gap-3 p-2">
                        <img src={m.poster_url} className="w-16 h-20 object-cover rounded" />
                        <div className="flex-1">
                          <div className="font-medium text-sm line-clamp-1">{m.title}</div>
                          <div className="text-xs text-gray-500">{m.year} • {(m.genres||[]).join(', ')}</div>
                          <div className="mt-2 flex items-center gap-2">
                            <button className="text-xs px-2 py-1 rounded bg-blue-600 text-white" onClick={()=>editMovie(m)}>Tahrirlash</button>
                            <button className="text-xs px-2 py-1 rounded bg-red-600 text-white" onClick={()=>deleteMovie(m.id)}>O‘chirish</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium mb-3">Foydalanuvchilar statistikasi</div>
                <div className="text-sm text-gray-600 mb-4">Jami: {users.length} ta</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [movies, setMovies] = useState([])
  const [popular, setPopular] = useState([])
  const [top, setTop] = useState([])
  const [query, setQuery] = useState('')
  const [playerOpen, setPlayerOpen] = useState(false)
  const [current, setCurrent] = useState(null)

  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem('uzb_token')
    const user = localStorage.getItem('uzb_user')
    return raw && user ? { token: raw, user: JSON.parse(user) } : null
  })

  const filtered = useMemo(() => {
    if (!query) return movies
    const q = query.toLowerCase()
    return movies.filter(m => [m.title, m.original_title, m.director, ...(m.cast||[])].filter(Boolean).some(x => x.toLowerCase().includes(q)))
  }, [movies, query])

  const load = async () => {
    setLoading(true)
    await fetch(`${API_BASE}/api/seed`, { method: 'POST' })
    const newest = await fetch(`${API_BASE}/api/movies?sort=new&limit=12`).then(r=>r.json())
    const popularRes = await fetch(`${API_BASE}/api/movies?sort=popular&limit=12`).then(r=>r.json())
    const topRes = await fetch(`${API_BASE}/api/movies?sort=rating&limit=12`).then(r=>r.json())
    setMovies(newest)
    setPopular(popularRes)
    setTop(topRes)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const onPlay = (movie) => {
    setCurrent(movie)
    setPlayerOpen(true)
  }

  const onProgress = async (sec) => {
    if (!current || !auth) return
    await fetch(`${API_BASE}/api/movies/${current.id}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: auth.user.id, position_sec: sec }) })
  }

  // ---- Auth minimal UI ----
  const [showAuth, setShowAuth] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const submitAuth = async (e) => {
    e.preventDefault()
    try {
      const url = isLogin ? `${API_BASE}/api/auth/login` : `${API_BASE}/api/auth/register`
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(isLogin ? { email: form.email, password: form.password } : form) })
      if (!res.ok) throw new Error('Auth failed')
      const data = await res.json()
      setAuth({ token: data.token, user: data.user })
      localStorage.setItem('uzb_token', data.token)
      localStorage.setItem('uzb_user', JSON.stringify(data.user))
      setShowAuth(false)
    } catch (e) {
      alert('Xato: kirish/ro‘yxatdan o‘tish bajarilmadi')
    }
  }

  const logout = () => {
    localStorage.removeItem('uzb_token')
    localStorage.removeItem('uzb_user')
    setAuth(null)
  }

  // Admin UI
  const [showAdmin, setShowAdmin] = useState(false)
  const refreshHome = () => load()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Film className="w-6 h-6 text-blue-600" />
          <div className="font-bold">UzbCinemaHub</div>
          <div className="flex-1" />
          <div className="relative w-full max-w-md">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full pl-3 pr-3 py-2 rounded-lg border bg-white/80 focus:outline-none" placeholder="Qidirish" />
          </div>
          {auth ? (
            <div className="flex items-center gap-3">
              {auth.user.role === 'admin' && (
                <button onClick={()=>setShowAdmin(true)} className="flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900">
                  <Shield className="w-4 h-4"/> Admin
                </button>
              )}
              <div className="text-sm">Salom, {auth.user.name}</div>
              <button onClick={logout} className="text-sm text-gray-700 hover:text-blue-600">Chiqish</button>
            </div>
          ) : (
            <button onClick={() => { setShowAuth(true); setIsLogin(true) }} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600">
              <LogIn className="w-4 h-4" /> Kirish
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-semibold mb-2">Yangi premyeralar</h1>
            <p className="text-white/80">Eng so'ngi filmlar va seriallar</p>
          </div>
        </section>

        <Section title="Yangi qo'shilganlar">
          {loading ? (
            <div className="text-center text-gray-500">Yuklanmoqda...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filtered.map(m => (
                <MovieCard key={m.id} movie={m} onPlay={onPlay} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Eng ko'p ko'rilganlar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popular.map(m => (
              <MovieCard key={m.id} movie={m} onPlay={onPlay} />
            ))}
          </div>
        </Section>

        <Section title="Tavsiya qilinganlar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {top.map(m => (
              <MovieCard key={m.id} movie={m} onPlay={onPlay} />
            ))}
          </div>
        </Section>
      </main>

      <footer className="py-10 text-center text-sm text-gray-500">© {new Date().getFullYear()} UzbCinemaHub</footer>

      <PlayerModal open={playerOpen} onClose={()=>setPlayerOpen(false)} movie={current} onProgress={onProgress} />

      {showAuth && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={()=>setShowAuth(false)}>
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">{isLogin ? 'Kirish' : 'Ro‘yxatdan o‘tish'}</div>
              <button onClick={()=>setShowAuth(false)} className="text-gray-500">Yopish</button>
            </div>
            <form onSubmit={submitAuth} className="p-4 space-y-3">
              {!isLogin && (
                <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="Ism" required />
              )}
              <input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="Email" required />
              <input type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="Parol" required />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">{isLogin ? 'Kirish' : 'Ro‘yxatdan o‘tish'}</button>
              <div className="text-center text-sm">
                {isLogin ? 'Hisob yo‘qmi?' : 'Allaqachon hisob bormi?'}{' '}
                <button type="button" className="text-blue-600" onClick={()=>setIsLogin(!isLogin)}>
                  {isLogin ? 'Ro‘yxatdan o‘tish' : 'Kirish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminPanel open={showAdmin} onClose={()=>setShowAdmin(false)} auth={auth} onDataChanged={refreshHome} />
    </div>
  )
}
