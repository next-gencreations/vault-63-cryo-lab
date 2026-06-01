import { useEffect, useState } from "react";

export function CinematicIntro({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const titleTimer = setTimeout(() => {
      setShowTitle(true);
    }, 12000);

    return () => clearTimeout(titleTimer);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 9999,
      }}
    >
      <video
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        onEnded={onComplete}
      >
        <source src="/vault63-intro.mp4" type="video/mp4" />
      </video>

      {showTitle && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              color: "#00ff44",
              fontSize: "clamp(32px,8vw,72px)",
              letterSpacing: "12px",
              textShadow: "0 0 20px #00ff44",
              fontFamily: "Courier New, monospace",
              fontWeight: "bold",
            }}
          >
            VAULT 63
          </div>

          <div
            style={{
              marginTop: 20,
              color: "#00aa44",
              fontSize: "clamp(12px,3vw,24px)",
              letterSpacing: "4px",
              fontFamily: "Courier New, monospace",
            }}
          >
            CRYOGENIC REVIVAL PROTOCOL INITIATED
          </div>
        </div>
      )}

      <button
        onClick={onComplete}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          background: "rgba(0,0,0,0.8)",
          border: "2px solid #00ff44",
          color: "#00ff44",
          padding: "12px 24px",
          borderRadius: 4,
          fontFamily: "Courier New, monospace",
          cursor: "pointer",
          boxShadow: "0 0 15px #00ff44",
        }}
      >
        SKIP INTRO
      </button>
    </div>
  );
}
