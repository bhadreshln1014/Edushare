import { Star } from "lucide-react"

export function StarRating({ value, max = 5, size = 16 }) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div
      className="relative flex"
      style={{ width: size * max, height: size }}
    >
      {/* Empty stars (background) */}
      {[...Array(max)].map((_, i) => (
        <Star
          key={`bg-${i}`}
          className="text-amber-300 opacity-20 absolute"
          style={{
            width: size,
            height: size,
            left: i * size,
            top: 0,
          }}
        />
      ))}

      {/* Filled stars (foreground) with overflow clipping */}
      <div
        className="absolute top-0 left-0 flex overflow-hidden"
        style={{ width: `${percentage}%`, height: size }}
      >
        {[...Array(max)].map((_, i) => (
          <Star
            key={`fg-${i}`}
            className="text-amber-400 fill-amber-400"
            style={{ width: size, height: size }}
          />
        ))}
      </div>
    </div>
  )
}
