import { useEffect, useState } from 'react'

const FIREWORK_COLORS = ['#e8be55', '#f2d98a', '#ff9d5c', '#c7cdd4', '#ffffff']

// 8 fixed burst directions (compass rose) instead of trig at runtime — kept
// deliberately simple/lightweight, not a full particle-physics effect.
const DIRECTIONS: [number, number][] = [
  [1, 0],
  [0.7, 0.7],
  [0, 1],
  [-0.7, 0.7],
  [-1, 0],
  [-0.7, -0.7],
  [0, -1],
  [0.7, -0.7],
]

const BURST_RADIUS = 70
const BURST_LIFETIME_MS = 1100
// Shorter than BURST_LIFETIME_MS so a new burst starts before the last one
// finishes fading — that overlap is what reads as "multiple at once" rather
// than a slow single-file sequence. Each burst is still only 8 small divs,
// so even 3-4 overlapping bursts is a trivial DOM/animation cost.
const SPAWN_INTERVAL_MS = 700

interface Burst {
  id: number
  left: number
  top: number
  color: string
}

export function Fireworks() {
  const [bursts, setBursts] = useState<Burst[]>([])

  useEffect(() => {
    let nextId = 0

    const spawnOne = () => {
      const id = nextId++
      setBursts((prev) => [
        ...prev,
        {
          id,
          left: 10 + Math.random() * 80,
          top: 8 + Math.random() * 45,
          color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
        },
      ])
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id))
      }, BURST_LIFETIME_MS)
    }

    // Occasionally fire two bursts in the same tick so it doesn't just look
    // like a steady metronome — still bounded, never more than 2 per tick.
    const spawn = () => {
      spawnOne()
      if (Math.random() < 0.4) spawnOne()
    }

    spawn()
    const interval = setInterval(spawn, SPAWN_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute"
          style={{ left: `${burst.left}%`, top: `${burst.top}%` }}
        >
          {DIRECTIONS.map(([dx, dy], i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                backgroundColor: burst.color,
                animation: `firework-particle ${BURST_LIFETIME_MS}ms ease-out forwards`,
                ['--firework-dx' as string]: `${dx * BURST_RADIUS}px`,
                ['--firework-dy' as string]: `${dy * BURST_RADIUS}px`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
