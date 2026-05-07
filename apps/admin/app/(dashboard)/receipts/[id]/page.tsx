"use client";

import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/layout/page-skeleton";

const Content = dynamic(() => import("./_content"), {
  ssr: false,
  loading: () => <PageSkeleton />,
});

export default function ReceiptDetailPage() {
  return <Content />;
}
