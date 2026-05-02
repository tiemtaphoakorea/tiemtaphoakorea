"use client";

import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import { useState } from "react";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";
import { TokenPill } from "../token-pill";

export function PaginationSection() {
  const [page, setPage] = useState(3);

  return (
    <>
      <SectionHeader
        num="16"
        id="pagination"
        title="Pagination Controls"
        desc="Smart page number ellipsis. Shows first/last jump buttons. Accepts currentPage, totalPages, onPageChange."
      />

      <ShowcaseBox title="pagination-controls — interactive">
        <PaginationControls currentPage={page} totalPages={12} onPageChange={setPage} />
        <div className="mt-2 flex justify-center">
          <TokenPill value={`currentPage: ${page} / totalPages: 12`} />
        </div>
      </ShowcaseBox>
    </>
  );
}
