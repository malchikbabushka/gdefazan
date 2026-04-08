"use client";

import type { PageContent } from "@/lib/pages-store";

function renderBody(body: string) {
  const lines = body.split(/\r?\n/);
  const blocks: Array<{ type: "p" | "ul"; lines: string[] }> = [];
  let buf: string[] = [];
  let inList = false;

  const flush = () => {
    if (buf.length === 0) return;
    blocks.push({ type: inList ? "ul" : "p", lines: buf });
    buf = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const isBullet = line.trimStart().startsWith("- ");

    if (line.trim() === "") {
      flush();
      inList = false;
      continue;
    }

    if (isBullet) {
      if (!inList) {
        flush();
        inList = true;
      }
      buf.push(line.trimStart().slice(2));
      continue;
    }

    if (inList) {
      flush();
      inList = false;
    }
    buf.push(line);
  }
  flush();

  return blocks;
}

export function SimpleContent({ content }: { content: PageContent }) {
  const blocks = renderBody(content.body);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
        {content.title}
      </h1>
      <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-200/80">
        {blocks.map((b, idx) =>
          b.type === "ul" ? (
            <ul key={idx} className="list-disc space-y-1 pl-5">
              {b.lines.map((t, j) => (
                <li key={j}>{t}</li>
              ))}
            </ul>
          ) : (
            <p key={idx}>{b.lines.join(" ")}</p>
          ),
        )}
      </div>
    </div>
  );
}

