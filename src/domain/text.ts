export function initials(name: string): string {
  for (const word of name.split(/\s+/)) {
    const letters = word.match(/\p{L}/gu);
    if (letters) return letters.slice(0, 2).join("").toUpperCase();
  }
  return "#";
}

export function searchKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function matches(query: string, ...fields: string[]): boolean {
  const key = searchKey(query);
  if (key === "") return true;
  return fields.some((field) => searchKey(field).includes(key));
}
