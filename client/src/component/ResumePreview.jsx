import React, { useMemo } from "react";

// ─── Markdown inline parser ───────────────────────────────────────────────────
// Converts **bold**, *italic*, `code` within a string to React elements
function parseInline(text, keyPrefix = "") {
  if (!text) return null;
  const parts = [];
  // Regex: **bold**, *italic*, `code`
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={`${keyPrefix}-b${i}`}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={`${keyPrefix}-i${i}`}>{m[3]}</em>);
    else if (m[4]) parts.push(<code key={`${keyPrefix}-c${i}`} style={{ fontFamily: "inherit", background: "#f1f5f9", padding: "0 3px", borderRadius: 3 }}>{m[4]}</code>);
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

// ─── Block parser ─────────────────────────────────────────────────────────────
// Converts raw markdown resume text into structured section objects
function parseResume(raw) {
  if (!raw) return { header: null, sections: [] };

  const lines = raw.split(/\r?\n/);
  const sections = [];
  let header = null;
  let current = null;
  let i = 0;

  // Try to detect header block (name + contact info at top)
  // Header ends when we hit a ## or ### section
  const headerLines = [];
  while (i < lines.length) {
    const line = lines[i].trim();
    // Stop header collection when a section heading appears
    if (/^#{1,3}\s/.test(line)) break;
    // Skip dividers like *** or ---
    if (/^(\*{3}|-{3,}|_{3,})$/.test(line)) { i++; break; }
    if (line) headerLines.push(line);
    i++;
  }
  if (headerLines.length) header = headerLines;

  // Parse remaining lines into sections
  for (; i < lines.length; i++) {
    const line = lines[i];
    const stripped = line.trim();

    // Skip bare dividers
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(stripped)) continue;
    if (!stripped) {
      // blank line just separates content inside a section
      if (current) current.entries.push({ type: "blank" });
      continue;
    }

    // Section heading (## or ###)
    const headingMatch = stripped.match(/^#{2,3}\s*(.+)$/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { title: headingMatch[1].trim().toUpperCase(), entries: [] };
      continue;
    }

    // Bullet list item
    if (/^[-•*]\s+/.test(stripped)) {
      const content = stripped.replace(/^[-•*]\s+/, "");
      if (current) current.entries.push({ type: "bullet", content });
      continue;
    }

    // Job / project title line (bold text with optional date on right — detect hfill pattern or tab)
    // Pattern: **Title** ... **Date** or **Title** \hfill Date
    const jobMatch = stripped.match(/^\*\*(.+?)\*\*\s*[–—-]\s*\*?(.+?)\*?\s+(.+)$/) ||
                     stripped.match(/^\*\*(.+?)\*\*\s+\\hfill\s+(.+)$/) ||
                     stripped.match(/^\*\*(.+?)\*\*\s{4,}(.+)$/);
    if (jobMatch && current) {
      current.entries.push({ type: "job-header", raw: stripped });
      continue;
    }

    // Regular paragraph / contact / anything else
    if (current) {
      current.entries.push({ type: "text", content: stripped });
    } else if (!header) {
      header = [stripped];
    } else {
      header.push(stripped);
    }
  }
  if (current) sections.push(current);

  return { header, sections };
}

// ─── Header renderer ──────────────────────────────────────────────────────────
function ResumeHeader({ lines }) {
  if (!lines || !lines.length) return null;

  // First non-empty line is the name (may have # prefix)
  const nameLine = lines[0].replace(/^#+\s*/, "");
  const rest = lines.slice(1);

  return (
    <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 14, borderBottom: "2px solid #1e293b" }}>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.04em", color: "#0f172a", textTransform: "uppercase", fontFamily: "'Georgia', serif", marginBottom: 6 }}>
        {nameLine.replace(/\*\*/g, "")}
      </div>
      {rest.map((line, idx) => {
        const clean = line.replace(/\*\*/g, "").replace(/\*/g, "");
        if (!clean.trim()) return null;
        return (
          <div key={idx} style={{ fontSize: 9.5, color: "#475569", letterSpacing: "0.02em", lineHeight: 1.7, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
            {parseInline(clean, `hdr-${idx}`)}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section renderer ─────────────────────────────────────────────────────────
function ResumeSection({ section }) {
  // Filter trailing blanks
  const entries = section.entries.filter((e, i) => {
    if (e.type === "blank") {
      // only keep blanks surrounded by real content
      const prev = section.entries[i - 1];
      const next = section.entries[i + 1];
      return prev && next && prev.type !== "blank" && next.type !== "blank";
    }
    return true;
  });

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Section title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", color: "#0f172a", textTransform: "uppercase", fontFamily: "'Georgia', serif", whiteSpace: "nowrap" }}>
          {section.title}
        </span>
        <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
      </div>

      {/* Entries */}
      {entries.map((entry, idx) => {
        if (entry.type === "blank") return <div key={idx} style={{ height: 5 }} />;

        if (entry.type === "bullet") {
          return (
            <div key={idx} style={{ display: "flex", gap: 7, marginBottom: 3, paddingLeft: 4 }}>
              <span style={{ fontSize: 9, color: "#0f172a", marginTop: 2.5, flexShrink: 0 }}>●</span>
              <span style={{ fontSize: 9.5, color: "#1e293b", lineHeight: 1.55, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                {parseInline(entry.content, `bullet-${idx}`)}
              </span>
            </div>
          );
        }

        if (entry.type === "job-header" || entry.type === "text") {
          const raw = entry.content || entry.raw || "";
          // Detect if it looks like a job header: has bold text + right-aligned date
          // We render these as a flex row with left content and optional right date
          const dateRightMatch = raw.match(/^(.+?)\s{3,}(\w{3}\s+\d{4}.*)$/) ||
                                  raw.match(/^(.+?)\s*[–—]\s*(.+?\d{4}.*)$/);

          if (dateRightMatch && (raw.includes("**") || /[A-Z]{3}\s+\d{4}/.test(raw))) {
            const left = dateRightMatch[1].trim();
            const right = dateRightMatch[2].trim();
            return (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3, marginTop: entry.type === "job-header" ? 7 : 0 }}>
                <span style={{ fontSize: 9.5, fontFamily: "'Helvetica Neue', Arial, sans-serif", color: "#0f172a" }}>
                  {parseInline(left, `jh-l-${idx}`)}
                </span>
                <span style={{ fontSize: 9, color: "#475569", fontStyle: "italic", whiteSpace: "nowrap", marginLeft: 8 }}>
                  {parseInline(right, `jh-r-${idx}`)}
                </span>
              </div>
            );
          }

          // Normal text line
          return (
            <div key={idx} style={{ fontSize: 9.5, color: "#1e293b", lineHeight: 1.6, marginBottom: 2, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
              {parseInline(raw, `txt-${idx}`)}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const ResumePreview = ({ markdown }) => {
  const { header, sections } = useMemo(() => parseResume(markdown), [markdown]);

  return (
    <div
      id="resume-preview-root"
      style={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "auto",
        background: "#ffffff",
        boxShadow: "0 4px 40px rgba(0,0,0,0.18), 0 1px 6px rgba(0,0,0,0.08)",
        padding: "12mm 12mm 10mm 12mm",
        boxSizing: "border-box",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        fontSize: 9.5,
        color: "#1e293b",
        lineHeight: 1.5,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {header && <ResumeHeader lines={header} />}
      {sections.map((sec, i) => (
        <ResumeSection key={i} section={sec} />
      ))}
    </div>
  );
};

export default ResumePreview;
