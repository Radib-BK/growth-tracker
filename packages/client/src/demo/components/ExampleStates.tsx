import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getPosts } from "@/demo/api";
import { Flag, Panel, PostList, Skeletons } from "@/demo/components/Panel";

export function ExampleStates() {
  const {
    data,
    error,
    isPending,
    isFetching,
    isLoading,
    isRefetching,
    isStale,
    isSuccess,
    status,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["demo", "states"],
    queryFn: () => getPosts(1, 4),
    // short on purpose, so isStale flips while you are still talking
    staleTime: 5_000,
  });

  return (
    <Panel
      title="2. isPending is not isFetching"
      subtitle="First load has nothing to show. A refetch already has rows on screen. Same hook, two very different UIs."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Flag name="isPending" on={isPending} />
        <Flag name="isFetching" on={isFetching} />
        <Flag name="isLoading" on={isLoading} />
        <Flag name="isRefetching" on={isRefetching} />
        <Flag name="isStale" on={isStale} />
        <Flag name="isSuccess" on={isSuccess} />
        <span className="rounded border px-2 py-1 font-mono text-xs text-neutral-500">
          status: {status}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <Button size="sm" onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? "refetching…" : "refetch()"}
        </Button>
        <span className="font-mono text-xs text-neutral-400">
          updated at {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"}
        </span>
      </div>

      {/* the whole point: skeleton only when there is nothing to show */}
      {isPending ? (
        <Skeletons rows={4} />
      ) : error ? (
        <p className="text-sm text-red-600">{(error as Error).message}</p>
      ) : (
        <div className={isFetching ? "opacity-50 transition-opacity" : "transition-opacity"}>
          <PostList posts={data ?? []} />
        </div>
      )}

      <p className="mt-4 text-sm text-neutral-500">
        Hit refetch: the rows stay put and only dim, because <code>isPending</code> is false, we
        already have data. A skeleton here would be a step backwards. Also try switching to another
        browser tab and back after 5 seconds, that alone triggers a refetch.
      </p>
    </Panel>
  );
}
