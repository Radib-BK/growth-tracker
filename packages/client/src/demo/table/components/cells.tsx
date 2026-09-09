import { Chip } from "@/demo/table/components/Lesson";
import type { Status, User } from "@/demo/table/data/users";

export function StatusCell({ status }: { status: Status }) {
  const tone = status === "active" ? "green" : status === "invited" ? "amber" : "red";
  return <Chip tone={tone}>{status}</Chip>;
}

export function PersonCell({ user }: { user: User }) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`;
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-neutral-200 text-[11px] font-semibold text-neutral-700">
        {initials}
      </span>
      <div className="min-w-0">
        <div className="truncate font-medium text-neutral-900">
          {user.firstName} {user.lastName}
        </div>
        <div className="truncate text-[11px] text-neutral-500">{user.email}</div>
      </div>
    </div>
  );
}

