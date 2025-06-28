'use client'

import Link from 'next/link'

interface MusicTrack {
  id: number
  title: string
  genre: string
  description: string
  sunoUrl: string
}

export default function MusicPage() {
  const musicTracks: MusicTrack[] = [
    {
      id: 1,
      title: "Black Rain on Rusted Streets",
      genre: "Grunge",
      description: "Gritty cityscape soundscapes - chaos and catharsis in neon-lit existence.",
      sunoUrl: "https://suno.com/playlist/9d52acbb-99e0-4fb6-be4d-da25f249e7c0"
    },
    {
      id: 2,
      title: "Frictions", 
      genre: "Blues-infused Grunge",
      description: "Blues-infused grunge playlist inspired by 2024.",
      sunoUrl: "https://suno.com/playlist/c95b0c7d-aea6-47ac-98dc-0e962aa23414"
    },
    {
      id: 3,
      title: "Refined Reflections",
      genre: "Introspective", 
      description: "Contemplative songs about maintaining coherence in an incoherent world.",
      sunoUrl: "https://suno.com/playlist/3342426d-f4c2-4646-b901-eb4a6a6e48de"
    },
    {
      id: 4,
      title: "Resonant Dream",
      genre: "Tribute", 
      description: "Coherence tribute to Dr. King.",
      sunoUrl: "https://suno.com/playlist/1c97df38-e595-4c05-8fe7-8b33e7db61f0"
    },
    {
      id: 5,
      title: "Rust and Revolt",
      genre: "Dark Melodic Rock", 
      description: "Heavy melodic rock confronting broken systems and challenging the status quo.",
      sunoUrl: "https://suno.com/playlist/19b8ecea-ac60-4d7f-9e27-17ea3d3db54d"
    }
  ]

  const handlePlaylistClick = (sunoUrl: string) => {
    window.open(sunoUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="h-screen bg-black text-terminal-green overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-8">
        <div className="mb-6">
          <Link href="/" className="text-terminal-amber hover:brightness-125 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">🎵 Sonic Neural Networks</h1>
          <p className="text-terminal-green-dim">Curated playlists and soundscapes inspired by Coherenceism</p>
        </div>

        <div className="space-y-6">
          {musicTracks.map((track) => (
            <div 
              key={track.id}
              className="border border-terminal-green-dim p-4 cursor-pointer hover:border-terminal-green transition-colors"
              onClick={() => handlePlaylistClick(track.sunoUrl)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-terminal-green font-bold text-lg">{track.title}</h3>
                <span className="text-terminal-amber text-sm ml-2">♪</span>
              </div>
              <p className="text-terminal-amber text-sm mb-2">{track.genre}</p>
              <p className="text-terminal-green-dim text-sm leading-relaxed mb-3">
                {track.description}
              </p>
              <div className="text-terminal-amber text-sm">
                → Open playlist in Suno
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 border-t border-terminal-green-dim">
          <p className="text-terminal-green-dim text-sm text-center">
            🎧 These playlists are hosted on Suno and will open in a new tab
          </p>
        </div>
      </div>
    </div>
  )
} 