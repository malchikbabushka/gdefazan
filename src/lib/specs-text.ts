export type ParsedSpecItem =
  | { kind: "section"; title: string }
  | { kind: "row"; label: string; value: string };

/**
 * Формат:\n
 * - Строка с `label: value` -> строка таблицы\n
 * - Строка без `:` -> заголовок секции\n
 * - Пустые строки допускаются (пропускаются)\n
 */
export function parseSpecsText(text: string): ParsedSpecItem[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const out: ParsedSpecItem[] = [];

  for (const line of lines) {
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx > 0) {
      out.push({
        kind: "row",
        label: line.slice(0, idx).trim(),
        value: line.slice(idx + 1).trim(),
      });
    } else {
      out.push({ kind: "section", title: line });
    }
  }

  return out;
}
