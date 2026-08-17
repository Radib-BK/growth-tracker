import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePostsPage } from "@/demo/queries";
import { Panel, PostList, Skeletons } from "@/demo/components/Panel";

function PagedList({ keepPrevious }: { keepPrevious: boolean }) {
  const [page, setPage] = useState(1);
  const { data, isPending, isFetching, isPlaceholderData } = usePostsPage(page, keepPrevious);

  return (
    <div className="rounded border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs text-neutral-500">
          {keepPrevious ? "placeholderData: keepPreviousData" : "no placeholderData"}
        </span>
        <span className="font-mono text-xs text-neutral-400">page {page}</span>
      </div>

      <div className="min-h-[172px]">
        {isPending ? (
          <Skeletons />
        ) : (
          <div className={isPlaceholderData ? "opacity-40 transition-opacity" : ""}>
            <PostList posts={data ?? []} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          // with placeholder data you must block this, or fast clicks race ahead
          disabled={isPlaceholderData || page === 10}
          onClick={() => setPage((p) => p + 1)}
        >
          next
        </Button>
        {isFetching && <span className="font-mono text-xs text-neutral-400">fetching…</span>}
      </div>
    </div>
  );
}

export function ExamplePlaceholder() {
  return (
    <Panel
      title="3. Paging with and without placeholder data"
      subtitle="Same data, same page size. Click next on both and watch what the table does while the next page loads."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <PagedList keepPrevious={false} />
        <PagedList keepPrevious />
      </div>
      <p className="mt-4 text-sm text-neutral-500">
        Left: every page is a brand new cache entry with no data, so it falls back to the skeleton
        and the table flashes empty. Right: the previous page stays on screen, dimmed, until the new
        rows arrive. Page back to 1 on either side, that one is instant, it is already cached.
      </p>
    </Panel>
  );
}
