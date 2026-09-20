import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.description}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090b",
          color: "#f4f4f5",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", fontSize: 32, color: "#2dd4bf" }}>
          {site.name}
        </div>
        <div style={{ display: "flex", fontSize: 60, lineHeight: 1.2 }}>
          {site.description}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#a1a1aa" }}>
          {site.author.name}
        </div>
      </div>
    ),
    size,
  );
}
