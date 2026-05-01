/** Upload a file to /api/upload and return the public URL. */
export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body });
  const data = await res.json();

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload thất bại");
  }

  return data.url as string;
}
