import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { listUsers } from "@/lib/usersApi";
import type { ListUsersResponse } from "@/lib/usersApi";
import type { User } from "@/lib/authApi";

const ROLES = ["LEARNER", "MANAGER"];
const DEPARTMENTS = ["Engineering", "Product", "Design", "Marketing", "Operations", "HR", "Other"];
const EXPERIENCE_LEVELS = ["JUNIOR", "MID", "SENIOR"];

const columnHelper = createColumnHelper<User>();

const ALL = "__all__";
const PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

function Home() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const columns = [
    columnHelper.accessor("email", { header: t("home.columnEmail"), size: 220 }),
    columnHelper.accessor("role", { header: t("home.columnRole"), size: 90 }),
    columnHelper.accessor("department", { header: t("home.columnDepartment"), size: 130 }),
    columnHelper.accessor("experienceLevel", { header: t("home.columnExperience"), size: 110 }),
    columnHelper.accessor("teamName", {
      header: t("home.columnTeam"),
      cell: (info) => info.getValue() ?? "—",
      enableSorting: false,
      size: 130,
    }),
    columnHelper.accessor("createdAt", {
      header: t("home.columnJoined"),
      cell: (info) => {
        const value = info.getValue();
        return value ? new Date(value).toLocaleDateString() : "—";
      },
      size: 110,
    }),
  ];

  const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
  const [pageSize, setPageSize] = useState(() => {
    const fromParams = Number(searchParams.get("pageSize"));
    return PAGE_SIZE_OPTIONS.includes(fromParams) ? fromParams : PAGE_SIZE;
  });
  const [role, setRole] = useState<string>(() => searchParams.get("role") || ALL);
  const [department, setDepartment] = useState<string>(() => searchParams.get("department") || ALL);
  const [experienceLevel, setExperienceLevel] = useState<string>(
    () => searchParams.get("experienceLevel") || ALL,
  );
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(() => searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    () => (searchParams.get("sortOrder") === "desc" ? "desc" : "asc"),
  );

  const [data, setData] = useState<ListUsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchInput === search) return;
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, search]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (page !== 1) params.page = String(page);
    if (pageSize !== PAGE_SIZE) params.pageSize = String(pageSize);
    if (role !== ALL) params.role = role;
    if (department !== ALL) params.department = department;
    if (experienceLevel !== ALL) params.experienceLevel = experienceLevel;
    if (search) params.search = search;
    if (sortBy !== "createdAt") params.sortBy = sortBy;
    if (sortOrder !== "asc") params.sortOrder = sortOrder;
    setSearchParams(params, { replace: true });
  }, [page, pageSize, role, department, experienceLevel, search, sortBy, sortOrder, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listUsers({
          page,
          pageSize,
          role: role === ALL ? undefined : role,
          department: department === ALL ? undefined : department,
          experienceLevel: experienceLevel === ALL ? undefined : experienceLevel,
          search: search || undefined,
          sortBy,
          sortOrder,
        });
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError(t("home.failedToLoad"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, role, department, experienceLevel, search, sortBy, sortOrder, t]);

  const sorting: SortingState = [{ id: sortBy, desc: sortOrder === "desc" }];

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    manualSorting: true,
    enableSortingRemoval: false,
    manualPagination: true,
    pageCount: data?.pagination.totalPages ?? -1,
    state: {
      sorting,
      pagination: { pageIndex: page - 1, pageSize },
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const [nextSort] = next;
      if (nextSort) {
        setSortBy(nextSort.id);
        setSortOrder(nextSort.desc ? "desc" : "asc");
        setPage(1);
      }
    },
    onPaginationChange: (updater) => {
      const current = { pageIndex: page - 1, pageSize };
      const next = typeof updater === "function" ? updater(current) : updater;
      setPage(next.pageIndex + 1);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full max-w-4xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">{t("home.title")}</h1>
          {user && (
            <p className="text-muted-foreground" data-testid="user-email">
              {t("home.signedInAs", { email: user.email })}
            </p>
          )}
        </div>
        <Button type="button" data-testid="logout-btn" variant="outline" onClick={() => void logout()}>
          {t("home.logout")}
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-lg text-foreground">{t("home.usersHeading")}</h2>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search">{t("home.searchLabel")}</Label>
            <Input
              id="search"
              placeholder={t("home.searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-56"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("home.roleLabel")}</Label>
            <Select
              value={role}
              onValueChange={(value) => {
                setRole(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("home.allRoles")}</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("home.departmentLabel")}</Label>
            <Select
              value={department}
              onValueChange={(value) => {
                setDepartment(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("home.allDepartments")}</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("home.experienceLabel")}</Label>
            <Select
              value={experienceLevel}
              onValueChange={(value) => {
                setExperienceLevel(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("home.allLevels")}</SelectItem>
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="overflow-x-auto rounded-md border border-input">
          <table className="w-full table-fixed text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-muted/50 text-start">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className="px-3 py-2 font-medium"
                        style={{ width: header.getSize() }}
                      >
                        {canSort ? (
                          <button
                            type="button"
                            className="flex items-center gap-1"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span className="text-muted-foreground">
                              {sortDirection === "asc" ? "↑" : sortDirection === "desc" ? "↓" : ""}
                            </span>
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: pageSize }, (_, rowIndex) => (
                  <tr key={rowIndex} className="h-11 border-b last:border-b-0" aria-hidden="true">
                    {table.getHeaderGroups()[0]?.headers.map((header) => (
                      <td
                        key={header.id}
                        data-testid={`skeleton-cell-${header.column.id}-${rowIndex}`}
                        className="px-3 py-2"
                      >
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {isLoading && (
                <tr className="sr-only" role="status">
                  <td colSpan={columns.length}>{t("home.loading")}</td>
                </tr>
              )}
              {!isLoading && data?.users.length === 0 && (
                <tr className="h-11">
                  <td className="px-3 py-4 text-muted-foreground" colSpan={columns.length}>{t("home.noUsers")}</td>
                </tr>
              )}
              {!isLoading &&
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="h-11 border-b last:border-b-0">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="truncate px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground text-sm">
            <div className="flex flex-wrap items-center gap-4">
              <span>
                {t("home.pageInfo", {
                  page: data.pagination.page,
                  totalPages: data.pagination.totalPages,
                  total: data.pagination.total,
                })}
              </span>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="pageSize" className="whitespace-nowrap text-muted-foreground">
                  {t("home.pageSizeLabel")}
                </Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="pageSize" className="w-18"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.setPageIndex(0)}
              >
                {t("home.first")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                {t("home.previous")}
              </Button>
              {(() => {
                const totalPages = data.pagination.totalPages;
                const windowSize = 5;
                let start = Math.max(1, page - 2);
                const end = Math.min(totalPages, start + windowSize - 1);
                start = Math.max(1, end - windowSize + 1);
                const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                return pageNumbers.map((pageNum) => (
                  <Button
                    key={pageNum}
                    type="button"
                    variant={pageNum === page ? "default" : "outline"}
                    onClick={() => table.setPageIndex(pageNum - 1)}
                  >
                    {pageNum}
                  </Button>
                ));
              })()}
              <Button
                type="button"
                variant="outline"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                {t("home.next")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!table.getCanNextPage()}
                onClick={() => table.setPageIndex(data.pagination.totalPages - 1)}
              >
                {t("home.last")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
