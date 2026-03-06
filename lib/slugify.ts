export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Build a pretty client URL segment: "john-doe" */
export function clientSlug(name: string): string {
  return slugify(name);
}
