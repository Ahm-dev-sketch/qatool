/**
 * Format records to JSON string.
 */
export function toJSON(data: unknown, pretty = true): string {
  return JSON.stringify(data, null, pretty ? 2 : undefined);
}

/**
 * Format array of objects to CSV string.
 */
export function toCSV(data: Array<Record<string, any>>): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const val = row[header];
        if (typeof val === "object" && val !== null) {
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        }
        return `"${String(val ?? "").replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
