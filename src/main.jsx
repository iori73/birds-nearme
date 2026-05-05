import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import BrainSpecimenPlate from "./BrainSpecimenPlate.jsx";

function ChapterSwitcher() {
  const [chapter, setChapter] = useState(
    () => localStorage.getItem("birds-nearme:chapter") || "gap"
  );
  const select = (c) => {
    setChapter(c);
    localStorage.setItem("birds-nearme:chapter", c);
  };
  const tabs = [
    { id: "gap",   label: "I. The Gap" },
    { id: "brain", label: "II. The Misread Brain" },
  ];

  // Switcher style adapts to the active chapter's background.
  // Chapter I = dark; Chapter II = paper. We use a neutral inkline that
  // works on both.
  const onPaper = chapter === "brain";
  const fg = onPaper ? "#2A2520" : "#F4EFE6";
  const fgSoft = onPaper ? "#8C8378" : "rgba(255,255,255,0.45)";
  const bg = onPaper ? "rgba(244,239,230,0.85)" : "rgba(12,12,12,0.85)";
  const border = onPaper ? "rgba(42,37,32,0.18)" : "rgba(255,255,255,0.08)";

  return (
    <>
      <div style={{
        position: "fixed", top: 14, right: 16, zIndex: 100,
        display: "flex", gap: 0,
        background: bg, backdropFilter: "blur(6px)",
        padding: "4px 6px", borderRadius: 2,
        border: `1px solid ${border}`,
        fontFamily: "'Spectral', 'Noto Serif JP', Georgia, serif",
      }}>
        {tabs.map((t, i) => (
          <button key={t.id} onClick={() => select(t.id)} style={{
            background: "transparent",
            color: chapter === t.id ? fg : fgSoft,
            border: "none",
            padding: "4px 14px",
            fontSize: 11,
            fontStyle: "italic",
            letterSpacing: "0.04em",
            cursor: "pointer",
            fontFamily: "inherit",
            borderLeft: i > 0 ? `1px solid ${border}` : "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>
      {chapter === "gap" ? <App /> : <BrainSpecimenPlate />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChapterSwitcher />
  </React.StrictMode>
);
