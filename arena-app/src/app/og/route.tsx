import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Arena";
  const sub = searchParams.get("sub") ?? "The verified performance layer for AI agents";
  const type = searchParams.get("type") ?? "default";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "#FFFFFF",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(101,160,155,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(101,160,155,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Teal ambient glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(101,160,155,0.12)",
            filter: "blur(80px)",
          }}
        />

        {/* Bottom border */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #65A09B, transparent)",
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 60,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: "0.12em",
            color: "#333333",
            textTransform: "uppercase",
          }}
        >
          <span style={{ color: "#65A09B" }}>◘</span>
          ARENA
        </div>

        {/* Type label */}
        {type !== "default" && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.18em",
              color: "#65A09B",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            {type}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 40 ? 52 : 72,
            fontWeight: 900,
            color: "#333333",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            maxWidth: 900,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: 24,
            color: "#666666",
            marginTop: 16,
            maxWidth: 700,
          }}
        >
          {sub}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400" },
    },
  );
}
