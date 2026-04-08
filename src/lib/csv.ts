export type CsvOptions = {
  delimiter: "," | ";" | "\t";
};

export function toCsv(rows: Array<Record<string, string>>, options: CsvOptions) {
  const { delimiter } = options;
  const headers = rows.length ? Object.keys(rows[0]!) : [];

  const escapeCell = (v: string) => {
    const mustQuote =
      v.includes('"') || v.includes("\n") || v.includes("\r") || v.includes(delimiter);
    const escaped = v.replaceAll('"', '""');
    return mustQuote ? `"${escaped}"` : escaped;
  };

  const lines: string[] = [];
  lines.push(headers.map(escapeCell).join(delimiter));
  for (const r of rows) {
    lines.push(headers.map((h) => escapeCell(r[h] ?? "")).join(delimiter));
  }
  return lines.join("\n");
}

export function parseCsv(text: string, options: CsvOptions) {
  const { delimiter } = options;
  const rows: string[][] = [];

  let row: string[] = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    // skip empty trailing row
    if (row.length === 1 && row[0] === "" && rows.length === 0) return;
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i]!;

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === delimiter) {
      pushCell();
      i += 1;
      continue;
    }

    if (ch === "\n") {
      pushCell();
      pushRow();
      i += 1;
      continue;
    }

    if (ch === "\r") {
      // handle CRLF or standalone CR
      if (text[i + 1] === "\n") i += 2;
      else i += 1;
      pushCell();
      pushRow();
      continue;
    }

    cell += ch;
    i += 1;
  }

  pushCell();
  pushRow();

  if (rows.length === 0) return { headers: [] as string[], records: [] as Record<string, string>[] };
  const headers = rows[0]!.map((h) => h.trim());
  const records = rows.slice(1).map((r) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = (r[idx] ?? "").trim();
    });
    return rec;
  });

  return { headers, records };
}

