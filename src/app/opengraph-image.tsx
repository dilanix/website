import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#08090a",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 72,
          fontWeight: 600,
          letterSpacing: 14,
          color: "#f5f5f2",
        }}
      >
        DILANIX
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 28,
          fontSize: 30,
          color: "#96969e",
        }}
      >
        Software for problems worth solving.
      </div>
    </div>,
    { ...size },
  );
}
