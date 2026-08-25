export function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Dot grid, representing interconnected systems — fades toward the edges so it never competes with the headline. */}
      <div
        className="absolute inset-0 opacity-45"
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
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--accent-secondary) 58%, transparent) 50%, transparent 100%)",
        }}
      />
      <div
        className="absolute top-[-10rem] left-[20%] h-[28rem] w-[30rem] rounded-full opacity-26 blur-[96px]"
        style={{ background: "var(--glow-blue)" }}
      />
      <div
        className="absolute top-[-8rem] right-[12%] h-[24rem] w-[26rem] rounded-full opacity-20 blur-[96px]"
        style={{ background: "var(--glow-cyan)" }}
      />
      <div
        className="absolute top-14 left-1/2 h-px w-40 -translate-x-1/2 overflow-hidden rounded-full opacity-70"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--accent-secondary) 40%, transparent) 18%, color-mix(in oklab, var(--accent) 58%, transparent) 50%, color-mix(in oklab, var(--accent-secondary) 40%, transparent) 82%, transparent 100%)",
        }}
      >
        <span className="bg-card-strong/85 absolute inset-y-[-3px] left-[36%] w-10 skew-x-[-24deg] blur-[1px]" />
      </div>
    </div>
  );
}
