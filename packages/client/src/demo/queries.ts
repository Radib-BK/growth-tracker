import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getPosts } from "@/demo/api";
import { countRequest } from "@/demo/requestCounter";

export const POSTS_LABEL = "demo/posts";

// Written once, called from any component. Same key = same cache entry.
export function usePosts() {
  return useQuery({
    queryKey: ["demo", "posts"],
    queryFn: () => {
      countRequest(POSTS_LABEL);
      return getPosts(1, 5);
    },
    staleTime: 10_000,
  });
}

// One entry per page. `keepPrevious` is part of the key so the two side by side
// lists in the placeholder example do not share a cache entry.
export function usePostsPage(page: number, keepPrevious: boolean) {
  return useQuery({
    queryKey: ["demo", "posts", { page, keepPrevious }],
    queryFn: () => getPosts(page, 5),
    placeholderData: keepPrevious ? keepPreviousData : undefined,
  });
}
