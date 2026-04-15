/**
 * Reusable space background — stars + nebula blobs.
 * Wrap any page section in a relative container and place this inside.
 * Pass `density="light"` for a subtler version (forms, auth pages).
 */
export default function SpaceBackground({ density = "full" }: { density?: "full" | "light" }) {
  const starCount = density === "full" ? 120 : 60;

  return (
    <>
      {/* Starfield */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(starCount)].map((_, i) => {
          const size = i % 20 === 0 ? 3 : i % 7 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1;
          const color =
            i % 5 === 0 ? "#c084fc" :
            i % 4 === 0 ? "#38bdf8" :
            i % 3 === 0 ? "#818cf8" :
            i % 7 === 0 ? "#f0abfc" : "#ffffff";
          return (
            <div
              key={i}
              className="absolute rounded-full animate-star"
              style={{
                width: size,
                height: size,
                background: color,
                boxShadow: size >= 2 ? `0 0 ${size * 3}px ${color}` : undefined,
                left: `${(i * 67 + 13) % 100}%`,
                top: `${(i * 41 + 7) % 100}%`,
                animationDelay: `${(i * 0.19) % 5}s`,
                animationDuration: `${1.8 + (i % 5) * 0.6}s`,
              }}
            />
          );
        })}
      </div>

      {/* Nebula blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute animate-nebula"
          style={{
            top: "-20%", left: "0%",
            width: density === "full" ? 600 : 400,
            height: density === "full" ? 600 : 400,
            background: "radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 65%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="absolute animate-nebula"
          style={{
            top: "30%", right: "-10%",
            width: density === "full" ? 500 : 320,
            height: density === "full" ? 500 : 320,
            background: "radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 65%)",
            filter: "blur(65px)",
            animationDelay: "5s",
          }}
        />
        <div
          className="absolute animate-nebula"
          style={{
            bottom: "-10%", left: "30%",
            width: density === "full" ? 450 : 280,
            height: density === "full" ? 450 : 280,
            background: "radial-gradient(circle, rgba(192,132,252,0.15) 0%, transparent 65%)",
            filter: "blur(60px)",
            animationDelay: "10s",
          }}
        />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#03050e]/20 to-[#03050e]/60 pointer-events-none" />
    </>
  );
}
