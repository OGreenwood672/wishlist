"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCategory, setCategoryArchived } from "@/app/actions/wishlist";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { Category } from "@/lib/types";
import { EditCategoryDialog } from "./category-form";

export function CategoryAdminActions({ category, slug }: { category: Category; slug: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => startTransition(async () => void (await setCategoryArchived(category.id, !category.is_archived)))}
      >
        {category.is_archived ? "Unarchive" : "Archive"}
      </Button>
      <ConfirmButton
        size="sm"
        variant="ghost"
        disabled={pending}
        confirmLabel="Confirm delete"
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteCategory(category.id);
            if (result.ok) router.replace(`/w/${slug}`);
          })
        }
      >
        Delete
      </ConfirmButton>
      <EditCategoryDialog category={category} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
