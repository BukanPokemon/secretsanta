import { useEffect, useState } from 'react'

const CONFETTI_COLORS = ['#EF6F6F', '#F2C94C', '#5CC48A', '#4FA9A0', '#E8A33D']

interface ConfettiPiece {
  id: number
  left: number
  width: number
  height: number
  speed: number
  delay: number
  color: string
  spin: number
  direction: 'confetti-rise-right' | 'confetti-rise-left'
}

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    // Scattered along the bottom edge (not just the two corners), each piece
    // rising on one of two opposite diagonals so the streams cross over the
    // whole page rather than reading as a single directional gust.
    const items = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage across screen
      width: Math.random() * 0.3 + 0.3, // 0.3-0.6rem
      height: Math.random() * 0.4 + 0.5, // 0.5-0.9rem
      speed: Math.random() * 8 + 12, // 12-20s
      delay: Math.random() * -20, // random start time
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      spin: Math.random() > 0.5 ? 1 : -1,
      direction:
        i % 2 === 0
          ? ('confetti-rise-right' as const)
          : ('confetti-rise-left' as const),
    }))
    setPieces(items)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute bottom-0 opacity-80"
          style={{
            left: `${piece.left}%`,
            width: `${piece.width}rem`,
            height: `${piece.height}rem`,
            backgroundColor: piece.color,
            animation: `${piece.direction} ${piece.speed}s linear infinite, confetti-spin ${piece.speed / 2}s linear infinite`,
            animationDelay: `${piece.delay}s, ${piece.delay}s`,
            ['--confetti-spin' as string]: piece.spin,
          }}
        />
      ))}
    </div>
  )
}
