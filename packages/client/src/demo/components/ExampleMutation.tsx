import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPost, type Post } from "@/demo/api";
import { usePosts } from "@/demo/queries";
import { Panel, PostList, Skeletons } from "@/demo/components/Panel";

export function ExampleMutation() {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  // the same hook the other page uses, so this list is the same cache entry
  const { data, isPending: listPending, isFetching } = usePosts();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: (newTitle: string) => createPost(newTitle),
    onSuccess: () => {
      // "this key is out of date" — anything on screen using it refetches
      queryClient.invalidateQueries({ queryKey: ["demo", "posts"] });
      setTitle("");
    },
  });

  // the other way: write straight into the cache, no refetch
  function addToCacheDirectly() {
    queryClient.setQueryData<Post[]>(["demo", "posts"], (old = []) => [
      { id: Date.now(), title: title || "written into the cache", body: "", userId: 1 },
      ...old,
    ]);
    setTitle("");
  }

  return (
    <Panel
      title="4. Writing: mutate, then invalidate"
      subtitle="The POST succeeds and the cache does not notice. Invalidating is how you tell it."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="new post title"
          className="max-w-xs"
        />
        <Button size="sm" disabled={isPending || !title} onClick={() => mutate(title)}>
          {isPending ? "saving…" : "mutate() + invalidate"}
        </Button>
        <Button variant="outline" size="sm" onClick={addToCacheDirectly}>
          setQueryData instead
        </Button>
        {isFetching && !listPending && (
          <span className="font-mono text-xs text-blue-600">refetching after invalidate…</span>
        )}
      </div>

      {isError && <p className="mb-3 text-sm text-red-600">{(error as Error).message}</p>}

      {listPending ? <Skeletons /> : <PostList posts={data ?? []} />}

      <p className="mt-4 text-sm text-neutral-500">
        jsonplaceholder is a fake API: it answers 201 with a new id but never really stores the post,
        so after invalidating, the refetched list looks the same. Watch the network tab, or the blue
        label above, that refetch is the part that matters. The second button shows the other option:{" "}
        <code>setQueryData</code> writes the row into the cache yourself, so the list changes
        immediately without asking the server.
      </p>
    </Panel>
  );
}
