"use client";

export function CurrentDate() {
  return <>{new Date().toLocaleDateString("vi-VN")}</>;
}
