/**
 * The only data source for the whole table session. No API, no fetch, no server.
 * Everything you see in /demo/table is derived from this array in the browser.
 *
 * The shape is deliberately mixed so every TanStack Table feature has something
 * real to chew on:
 *   - strings        -> global search, fuzzy filter
 *   - enums          -> faceted (multi select) filters
 *   - numbers        -> numeric sort, range filter, aggregation
 *   - date strings   -> custom sortingFn (lexical sort would be a bug here)
 *   - optional field -> accessorFn + cell fallback
 *   - reports[]      -> sub rows, so expanding has a tree to open
 */

export type Role = "Owner" | "Admin" | "Editor" | "Viewer";
export type Department = "Engineering" | "Design" | "Sales" | "Support" | "Finance";
export type Status = "active" | "invited" | "suspended";

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  department: Department;
  status: Status;
  salary: number;
  /** ISO date, kept as a string on purpose - see the sorting lesson */
  joinedAt: string;
  lastActive: string;
  country: string;
  city: string;
  projects: number;
  /** sparse: most users have none */
  notes?: string;
  /** direct reports, used by getSubRows() in the expanding lesson */
  reports?: User[];
};

export const users: User[] = [
  {
    id: 1,
    firstName: "Amara",
    lastName: "Okafor",
    email: "amara.okafor@northwind.io",
    role: "Owner",
    department: "Engineering",
    status: "active",
    salary: 198000,
    joinedAt: "2018-03-12",
    lastActive: "2026-09-08",
    country: "Nigeria",
    city: "Lagos",
    projects: 14,
    notes: "Founded the platform team.",
    reports: [
      {
        id: 2,
        firstName: "Tobias",
        lastName: "Lund",
        email: "tobias.lund@northwind.io",
        role: "Admin",
        department: "Engineering",
        status: "active",
        salary: 152000,
        joinedAt: "2019-07-01",
        lastActive: "2026-09-09",
        country: "Sweden",
        city: "Malmo",
        projects: 9,
      },
      {
        id: 3,
        firstName: "Priya",
        lastName: "Raghunathan",
        email: "priya.r@northwind.io",
        role: "Editor",
        department: "Engineering",
        status: "active",
        salary: 141000,
        joinedAt: "2020-01-20",
        lastActive: "2026-09-07",
        country: "India",
        city: "Bengaluru",
        projects: 11,
        notes: "Owns the migration runbook.",
      },
      {
        id: 4,
        firstName: "Marcus",
        lastName: "Deng",
        email: "marcus.deng@northwind.io",
        role: "Editor",
        department: "Engineering",
        status: "invited",
        salary: 128000,
        joinedAt: "2025-11-04",
        lastActive: "2026-09-01",
        country: "Singapore",
        city: "Singapore",
        projects: 2,
      },
    ],
  },
  {
    id: 5,
    firstName: "Hana",
    lastName: "Sato",
    email: "hana.sato@northwind.io",
    role: "Admin",
    department: "Design",
    status: "active",
    salary: 134000,
    joinedAt: "2019-02-18",
    lastActive: "2026-09-09",
    country: "Japan",
    city: "Osaka",
    projects: 8,
    notes: "Design system lead.",
    reports: [
      {
        id: 6,
        firstName: "Elif",
        lastName: "Demir",
        email: "elif.demir@northwind.io",
        role: "Editor",
        department: "Design",
        status: "active",
        salary: 108000,
        joinedAt: "2021-05-10",
        lastActive: "2026-09-06",
        country: "Turkey",
        city: "Izmir",
        projects: 6,
      },
      {
        id: 7,
        firstName: "Noah",
        lastName: "Brennan",
        email: "noah.brennan@northwind.io",
        role: "Viewer",
        department: "Design",
        status: "suspended",
        salary: 92000,
        joinedAt: "2022-08-30",
        lastActive: "2026-04-19",
        country: "Ireland",
        city: "Cork",
        projects: 1,
        notes: "Access revoked pending review.",
      },
    ],
  },
  {
    id: 8,
    firstName: "Diego",
    lastName: "Marquez",
    email: "diego.marquez@northwind.io",
    role: "Admin",
    department: "Sales",
    status: "active",
    salary: 127500,
    joinedAt: "2020-09-14",
    lastActive: "2026-09-08",
    country: "Mexico",
    city: "Guadalajara",
    projects: 17,
    reports: [
      {
        id: 9,
        firstName: "Sofia",
        lastName: "Almeida",
        email: "sofia.almeida@northwind.io",
        role: "Editor",
        department: "Sales",
        status: "active",
        salary: 99000,
        joinedAt: "2021-11-02",
        lastActive: "2026-09-09",
        country: "Portugal",
        city: "Porto",
        projects: 13,
      },
      {
        id: 10,
        firstName: "Kwame",
        lastName: "Boateng",
        email: "kwame.boateng@northwind.io",
        role: "Viewer",
        department: "Sales",
        status: "invited",
        salary: 74000,
        joinedAt: "2026-01-08",
        lastActive: "2026-08-28",
        country: "Ghana",
        city: "Accra",
        projects: 0,
      },
    ],
  },
];

/**
 * The remaining 45 people, written as tuples so the file stays readable.
 * Same shape as above once mapped - there is no magic, just less typing.
 * [id, first, last, role, department, status, salary, joinedAt, lastActive, country, city, projects, notes?]
 */
type Row = [
  number, string, string, Role, Department, Status,
  number, string, string, string, string, number, string?,
];

const rest: Row[] = [
  [11, "Leila", "Haddad", "Editor", "Engineering", "active", 137000, "2019-10-21", "2026-09-09", "Lebanon", "Beirut", 10],
  [12, "Oskar", "Nowak", "Viewer", "Engineering", "active", 96000, "2023-03-06", "2026-09-05", "Poland", "Krakow", 4],
  [13, "Fatima", "Zahra", "Editor", "Support", "active", 88000, "2021-01-11", "2026-09-08", "Morocco", "Casablanca", 21, "Highest ticket throughput."],
  [14, "Julian", "Weiss", "Admin", "Finance", "active", 145000, "2018-06-25", "2026-09-04", "Germany", "Stuttgart", 7],
  [15, "Mei", "Lin", "Editor", "Design", "active", 115000, "2020-04-17", "2026-09-09", "Taiwan", "Taipei", 9],
  [16, "Ravi", "Menon", "Viewer", "Support", "invited", 69000, "2026-02-02", "2026-08-30", "India", "Kochi", 0],
  [17, "Anneke", "Visser", "Editor", "Sales", "active", 102000, "2022-02-14", "2026-09-07", "Netherlands", "Utrecht", 12],
  [18, "Yusuf", "Kaya", "Viewer", "Engineering", "suspended", 84000, "2021-09-09", "2026-03-11", "Turkey", "Ankara", 3, "On leave since March."],
  [19, "Clara", "Bianchi", "Admin", "Design", "active", 131000, "2019-12-03", "2026-09-08", "Italy", "Bologna", 8],
  [20, "Emeka", "Nwosu", "Editor", "Engineering", "active", 139500, "2020-07-28", "2026-09-09", "Nigeria", "Abuja", 15],
  [21, "Sara", "Lindqvist", "Viewer", "Finance", "active", 91000, "2023-08-15", "2026-09-02", "Sweden", "Uppsala", 5],
  [22, "Tom", "Fitzgerald", "Editor", "Support", "active", 79500, "2022-05-19", "2026-09-06", "Ireland", "Galway", 18],
  [23, "Nadia", "Petrova", "Admin", "Engineering", "active", 158000, "2018-11-30", "2026-09-09", "Bulgaria", "Sofia", 16, "Runs the on-call rotation."],
  [24, "Hugo", "Martins", "Viewer", "Sales", "invited", 71000, "2026-03-23", "2026-09-01", "Brazil", "Curitiba", 1],
  [25, "Ingrid", "Solberg", "Editor", "Finance", "active", 118000, "2021-06-07", "2026-09-05", "Norway", "Bergen", 6],
  [26, "Chen", "Wei", "Editor", "Engineering", "active", 143000, "2019-04-09", "2026-09-08", "China", "Chengdu", 12],
  [27, "Aisha", "Bello", "Viewer", "Support", "active", 66000, "2024-01-15", "2026-09-09", "Nigeria", "Kano", 9],
  [28, "Lucas", "Moreau", "Admin", "Sales", "active", 124000, "2020-02-26", "2026-09-03", "France", "Lyon", 19],
  [29, "Zoe", "Papadakis", "Editor", "Design", "suspended", 106000, "2022-10-12", "2026-05-30", "Greece", "Thessaloniki", 4],
  [30, "Ahmad", "Rahimi", "Viewer", "Engineering", "active", 89000, "2023-11-20", "2026-09-07", "UAE", "Dubai", 3],
  [31, "Beatriz", "Costa", "Editor", "Finance", "active", 113500, "2021-03-04", "2026-09-08", "Portugal", "Lisbon", 7],
  [32, "Viktor", "Horvath", "Viewer", "Support", "active", 64000, "2024-06-18", "2026-09-09", "Hungary", "Budapest", 11],
  [33, "Nina", "Kowalczyk", "Admin", "Design", "active", 129000, "2019-08-22", "2026-09-06", "Poland", "Gdansk", 10],
  [34, "Samuel", "Adeyemi", "Editor", "Engineering", "active", 147000, "2018-09-17", "2026-09-09", "Nigeria", "Ibadan", 20, "Longest tenure outside the founders."],
  [35, "Linh", "Tran", "Viewer", "Sales", "active", 77000, "2023-05-29", "2026-09-04", "Vietnam", "Da Nang", 8],
  [36, "Gabriel", "Rossi", "Editor", "Support", "invited", 72500, "2026-04-11", "2026-08-27", "Italy", "Torino", 0],
  [37, "Freya", "Andersen", "Editor", "Design", "active", 111000, "2020-12-08", "2026-09-08", "Denmark", "Aarhus", 6],
  [38, "Omar", "Farouk", "Admin", "Finance", "active", 152500, "2019-01-14", "2026-09-05", "Egypt", "Alexandria", 9],
  [39, "Katya", "Ivanova", "Viewer", "Engineering", "active", 93000, "2023-02-27", "2026-09-09", "Kazakhstan", "Almaty", 5],
  [40, "Daniel", "Okonkwo", "Editor", "Sales", "active", 98500, "2022-07-06", "2026-09-07", "Nigeria", "Enugu", 14],
  [41, "Marta", "Sanchez", "Editor", "Support", "active", 81000, "2021-08-16", "2026-09-08", "Spain", "Valencia", 16],
  [42, "Jonas", "Berger", "Viewer", "Finance", "suspended", 87000, "2022-11-23", "2026-02-14", "Austria", "Graz", 2, "Contract ended, record kept."],
  [43, "Ayesha", "Siddiqui", "Editor", "Engineering", "active", 136000, "2020-05-05", "2026-09-09", "Pakistan", "Lahore", 13],
  [44, "Felix", "Mwangi", "Viewer", "Design", "active", 94000, "2024-03-19", "2026-09-06", "Kenya", "Nairobi", 4],
  [45, "Isabella", "Ferreira", "Admin", "Sales", "active", 121500, "2019-06-11", "2026-09-08", "Brazil", "Recife", 18],
  [46, "Henrik", "Jensen", "Editor", "Finance", "active", 116000, "2021-10-27", "2026-09-03", "Denmark", "Odense", 8],
  [47, "Rania", "Khalil", "Viewer", "Support", "invited", 63000, "2026-05-02", "2026-08-31", "Jordan", "Amman", 1],
  [48, "Pablo", "Guzman", "Editor", "Engineering", "active", 142500, "2019-11-13", "2026-09-09", "Colombia", "Medellin", 17],
  [49, "Yara", "Haddad", "Editor", "Design", "active", 109500, "2022-01-31", "2026-09-07", "Lebanon", "Tripoli", 5],
  [50, "Stefan", "Novak", "Viewer", "Sales", "active", 76500, "2023-09-25", "2026-09-05", "Slovenia", "Maribor", 10],
  [51, "Grace", "Achieng", "Editor", "Support", "active", 84500, "2022-04-08", "2026-09-09", "Kenya", "Mombasa", 22, "Fastest first response time."],
  [52, "Arjun", "Kapoor", "Admin", "Engineering", "active", 156000, "2018-08-20", "2026-09-08", "India", "Pune", 15],
  [53, "Elena", "Vasquez", "Viewer", "Finance", "active", 90500, "2024-02-12", "2026-09-04", "Chile", "Santiago", 3],
  [54, "Mateo", "Silva", "Editor", "Sales", "active", 101000, "2021-12-15", "2026-09-06", "Argentina", "Cordoba", 11],
  [55, "Sanne", "de Vries", "Editor", "Design", "active", 112500, "2020-10-01", "2026-09-09", "Netherlands", "Eindhoven", 7],
];

for (const [
  id, firstName, lastName, role, department, status,
  salary, joinedAt, lastActive, country, city, projects, notes,
] of rest) {
  users.push({
    id,
    firstName,
    lastName,
    email: `${firstName}.${lastName}@northwind.io`.toLowerCase().replace(/\s+/g, ""),
    role,
    department,
    status,
    salary,
    joinedAt,
    lastActive,
    country,
    city,
    projects,
    ...(notes ? { notes } : {}),
  });
}

/** Flattened, ignoring the reports tree - handy for lessons that do not use sub rows. */
export const flatUsers: User[] = users.flatMap((u) => [u, ...(u.reports ?? [])]);

/** 55 people: 10 written out longhand above (3 managers + their 7 reports) and 45 from the tuples. */
export const totalUserCount = flatUsers.length;

export const roles: Role[] = ["Owner", "Admin", "Editor", "Viewer"];
export const departments: Department[] = [
  "Engineering", "Design", "Sales", "Support", "Finance",
];
export const statuses: Status[] = ["active", "invited", "suspended"];

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const fullName = (u: User) => `${u.firstName} ${u.lastName}`;

/* ------------------------------------------------------------------ */
/* Bulk rows, for the virtualization lesson only                       */
/* ------------------------------------------------------------------ */

/**
 * 55 hand written people is the right size for reading a table, and far too
 * small to show why virtualization matters - the browser renders 55 rows
 * without complaining. So the virtualization lesson needs thousands.
 *
 * Rather than invent a second shape, this recycles the real rows above and
 * varies them: every generated person is a genuine User, so the same columns,
 * filters and formatters keep working.
 *
 * It is a function, not a const, because only one lesson wants 10.000 rows and
 * nobody else should pay to build them on import.
 */
export function makeManyUsers(count: number): User[] {
  const seeds = flatUsers;
  const out: User[] = [];

  for (let i = 0; i < count; i++) {
    const seed = seeds[i % seeds.length];
    // shift the borrowed values so each copy is distinguishable, not a clone
    const lastName = `${seed.lastName}${i < seeds.length ? "" : `-${Math.floor(i / seeds.length)}`}`;

    out.push({
      ...seed,
      id: i + 1,
      lastName,
      email: `${seed.firstName}.${lastName}${i}@northwind.io`.toLowerCase().replace(/\s+/g, ""),
      role: roles[i % roles.length],
      department: departments[i % departments.length],
      status: statuses[i % statuses.length],
      salary: 60000 + ((i * 137) % 120000),
      projects: i % 25,
      // sub rows and notes would only be noise in a 10.000 row scroll
      reports: undefined,
      notes: undefined,
    });
  }

  return out;
}
