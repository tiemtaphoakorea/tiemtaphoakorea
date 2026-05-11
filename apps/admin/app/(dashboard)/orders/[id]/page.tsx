"use client";

import Content from "./_content";

export default function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  return <Content {...props} />;
}
