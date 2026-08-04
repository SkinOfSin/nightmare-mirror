import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  ssr: false,
  component: NightmareMirrorApp,
});

/**
 * Skin of Sin — Nightmare Mirror
 * Hands off immediately to the full standalone app (spiders, blood, ritual,
 * pupil burst, export, record) so live preview + publish match the download.
 */
function NightmareMirrorApp() {
  useEffect(() => {
    // Full feature set lives in the standalone HTML (same file user downloaded).
    // Replace so there is no React chrome / iframe wrapper.
    if (typeof window !== "undefined") {
      window.location.replace("/nightmare.html");
    }
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "#050203",
        color: "#d8c8b8",
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        letterSpacing: "0.06em",
      }}
    >
      <p style={{ margin: 0, fontSize: 18 }}>Opening Nightmare Mirror…</p>
    </div>
  );
}
