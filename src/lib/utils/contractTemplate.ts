export function mergeContractTemplate(
  content: string,
  data: Record<string, string | number | null | undefined>,
) {
  let output = content;
  Object.entries(data).forEach(([key, value]) => {
    const safe = value ?? "";
    const pattern = new RegExp(`{{\\s*${escapeRegex(key)}\\s*}}`, "g");
    output = output.replace(pattern, String(safe));
  });
  return output;
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
