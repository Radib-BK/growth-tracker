const BASE = "https://jsonplaceholder.typicode.com";

export type Post = { id: number; title: string; body: string; userId: number };

// jsonplaceholder answers in ~50ms, which is too fast to see a loading state
// on a projector. Every demo request is slowed down on purpose.
const DEMO_DELAY_MS = 900;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getPosts(page = 1, limit = 5): Promise<Post[]> {
  await sleep(DEMO_DELAY_MS);
  const res = await fetch(`${BASE}/posts?_page=${page}&_limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load posts");
  return res.json();
}

export async function createPost(title: string): Promise<Post> {
  await sleep(DEMO_DELAY_MS);
  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body: "written from the demo", userId: 1 }),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}
