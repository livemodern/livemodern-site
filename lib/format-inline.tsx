import React from "react";

// Minimal, safe inline formatter for MiLa's chat bubbles. She's instructed not
// to use markdown, but if a stray **bold** or *emphasis* slips through we render
// it as real emphasis instead of showing literal asterisks. Handles **bold** and
// *italic*; everything else is plain text. No HTML injection — text nodes only.
export function formatInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on **bold** first, then *italic* within the plain segments.
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  boldParts.forEach((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      nodes.push(<strong key={`b${i}`}>{bold[1]}</strong>);
      return;
    }
    // italic within non-bold text
    const italParts = part.split(/(\*[^*]+\*)/g);
    italParts.forEach((ip, j) => {
      const ital = ip.match(/^\*([^*]+)\*$/);
      if (ital) nodes.push(<em key={`i${i}-${j}`}>{ital[1]}</em>);
      else if (ip) nodes.push(<React.Fragment key={`t${i}-${j}`}>{ip.replace(/\*+/g, "")}</React.Fragment>);
    });
  });
  return nodes;
}
