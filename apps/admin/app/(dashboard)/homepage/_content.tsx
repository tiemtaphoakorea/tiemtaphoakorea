"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { CollectionFormDrawer } from "./_components/collection-form-drawer";
import { CollectionList } from "./_components/collection-list";

export default function HomepageContent() {
  // undefined = drawer closed, null = creating new, string = editing existing
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined);

  const collectionsQuery = useQuery({
    queryKey: queryKeys.homepageCollections.list,
    queryFn: () => adminClient.listHomepageCollections(),
    staleTime: 30_000,
  });

  // API returns { collections: [...] }
  const collections = collectionsQuery.data?.collections ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {collectionsQuery.isLoading ? "Đang tải..." : `${collections.length} collections`}
        </span>
        <Button className="h-[34px] gap-1.5" onClick={() => setEditingId(null)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Tạo collection
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <CollectionList
          collections={collections}
          isLoading={collectionsQuery.isLoading}
          onEdit={(id) => setEditingId(id)}
        />
      </Card>

      {editingId !== undefined && (
        <CollectionFormDrawer collectionId={editingId} onClose={() => setEditingId(undefined)} />
      )}
    </div>
  );
}
