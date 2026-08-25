import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = await readFile(
  join(process.cwd(), "public/dilanix-logo.png"),
  "base64",
);

const logoSrc = `data:image/png;base64,${logoData}`;

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
        background:
          "linear-gradient(135deg, #f8fbff 0%, #eef6ff 52%, #f5fcff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 88,
          bottom: 78,
          width: 220,
          height: 220,
          borderRadius: 9999,
          background: "rgba(27, 122, 255, 0.12)",
          filter: "blur(22px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 76,
          right: 98,
          width: 260,
          height: 260,
          borderRadius: 9999,
          background: "rgba(17, 205, 216, 0.14)",
          filter: "blur(28px)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 72px",
          borderRadius: 40,
          background: "rgba(255, 255, 255, 0.8)",
          boxShadow: "0 24px 60px rgba(14, 42, 90, 0.10)",
        }}
      >
        <img
          src={logoSrc}
          alt={siteConfig.name}
          width={820}
          height={274}
          style={{ objectFit: "contain" }}
        />
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: -0.4,
            color: "#26425f",
          }}
        >
          Software for problems worth solving.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 36,
          display: "flex",
          fontSize: 18,
          color: "#4a6a89",
          letterSpacing: 0.2,
        }}
      >
        {siteConfig.url}
      </div>
    </div>,
    { ...size },
  );
}
