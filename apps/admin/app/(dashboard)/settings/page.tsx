"use client";

import dynamic from "next/dynamic";

const Content = dynamic(() => import("./_content"), {
  ssr: false,
  loading: () => null,
});

export default function SettingsPage() {
  return <Content />;
}
