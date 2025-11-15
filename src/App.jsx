import { useEffect, useMemo, useState } from 'react'
import { Play, Star, BookmarkPlus, Search, Film, ThumbsUp, Clock } from 'lucide-react'

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
          <button onClick={() => onSave(movie)} className="text-sm text-gray-700 hover:text-blue-600 flex items-center gap-1">
            <BookmarkPlus className="w-4 h-4" /> Saqlash
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

export default function App() {
  const [loading, setLoading] = useState(true)
  const [movies, setMovies] = useState([])
  const [popular, setPopular] = useState([])
  const [top, setTop] = useState([])
  const [query, setQuery] = useState('')
  const [playerOpen, setPlayerOpen] = useState(false)
  const [current, setCurrent] = useState(null)
  const userId = 'demo-user-1'

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

  const onSave = async (movie) => {
    await fetch(`${API_BASE}/api/movies/${movie.id}/watchlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) })
    alert('Saqlash ro\'yxatiga qo\'shildi/olib tashlandi')
  }

  const onProgress = async (sec) => {
    if (!current) return
    await fetch(`${API_BASE}/api/movies/${current.id}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, position_sec: sec }) })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Film className="w-6 h-6 text-blue-600" />
          <div className="font-bold">UzbCinemaHub</div>
          <div className="flex-1" />
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg border bg-white/80 focus:outline-none" placeholder="Kino, aktyor, rejissyor bo'yicha qidirish" />
          </div>
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
                <MovieCard key={m.id} movie={m} onPlay={onPlay} onSave={onSave} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Eng ko'p ko'rilganlar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popular.map(m => (
              <MovieCard key={m.id} movie={m} onPlay={onPlay} onSave={onSave} />
            ))}
          </div>
        </Section>

        <Section title="Tavsiya qilinganlar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {top.map(m => (
              <MovieCard key={m.id} movie={m} onPlay={onPlay} onSave={onSave} />
            ))}
          </div>
        </Section>
      </main>

      <footer className="py-10 text-center text-sm text-gray-500">© {new Date().getFullYear()} UzbCinemaHub</footer>

      <PlayerModal open={playerOpen} onClose={()=>setPlayerOpen(false)} movie={current} onProgress={onProgress} />
    </div>
  )
}
