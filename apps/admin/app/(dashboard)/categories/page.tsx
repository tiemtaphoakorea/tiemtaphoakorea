"use client";

import dynamic from "next/dynamic";

const Content = dynamic(() => import("./_content"), {
  ssr: false,
  loading: () => null,
});

export default function AdminCategories() {
  return <Content />;
}
