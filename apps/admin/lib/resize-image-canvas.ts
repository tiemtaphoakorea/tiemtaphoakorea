"use client";

/** Load an image from URL with crossOrigin=anonymous to avoid canvas taint */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Resize an image URL to target dimensions, returns PNG Blob */
export async function resizeImageViaCanvas(
  src: string,
  width: number,
  height: number,
): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/png",
    );
  });
}

/** Upload a Blob to /api/upload, returns the public URL */
export async function uploadBlob(blob: Blob, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", new File([blob], filename, { type: "image/png" }));
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url as string;
}
