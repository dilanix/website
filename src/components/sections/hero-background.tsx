export function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Dot grid, representing interconnected systems — fades toward the edges so it never competes with the headline. */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(var(--grid-dot) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, black 0%, transparent 75%)",
        }}
      />
      {/* Soft accent glow */}
      <div
        className="absolute top-[-12rem] left-1/2 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "var(--accent)" }}
      />
    </div>
  );
}
