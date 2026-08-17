import { useState } from "react";
import { Button } from "@/components/ui/button";
import { POSTS_LABEL, usePosts } from "@/demo/queries";
import { resetRequestCount, useRequestCount } from "@/demo/requestCounter";
import { Panel, PostList, Skeletons } from "@/demo/components/Panel";

// Two unrelated components. Neither knows the other exists.
// Both call the same hook, so both read the same cache entry.

function PostCountBadge() {
  const { data, isPending } = usePosts();
  return (
    <div className="rounded border bg-neutral-50 p-3 text-sm">
      <div className="mb-1 font-mono text-xs text-neutral-400">&lt;PostCountBadge/&gt;</div>
      {isPending ? "loading…" : `${data?.length ?? 0} posts`}
    </div>
  );
}

function PostTable() {
  const { data, isPending } = usePosts();
  return (
    <div className="rounded border bg-neutral-50 p-3">
      <div className="mb-2 font-mono text-xs text-neutral-400">&lt;PostTable/&gt;</div>
      {isPending ? <Skeletons /> : <PostList posts={data ?? []} />}
    </div>
  );
}

export function ExampleReuse() {
  const [showTable, setShowTable] = useState(true);
  const fetchCount = useRequestCount(POSTS_LABEL);

  return (
    <Panel
      title="1. One query, many components"
      subtitle="Both components call usePosts(). Watch the request counter: it does not go up for the second one."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded border border-blue-600 bg-blue-50 px-3 py-1 font-mono text-sm text-blue-700">
          requests for ['demo','posts']: {fetchCount}
        </span>
        <Button variant="outline" size="sm" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Unmount the table" : "Mount the table"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => resetRequestCount(POSTS_LABEL)}>
          reset counter
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PostCountBadge />
        {showTable ? (
          <PostTable />
        ) : (
          <div className="rounded border border-dashed p-3 text-sm text-neutral-400">
            table is unmounted
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-neutral-500">
        Unmount the table and mount it again: the rows come back instantly with no new request,
        because the cached entry is still fresh (staleTime is 10s here). Wait more than 10 seconds
        and mount it again, and it refetches in the background while showing the cached rows.
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        Switch to another browser tab and come back: the counter goes up by exactly 1, not 2. That is
        the window-focus trigger refetching this one query, and both components get the new data. The
        panel below has its own query, so it refetches on focus too, but it is counted separately.
      </p>
    </Panel>
  );
}
