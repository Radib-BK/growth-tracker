import { Request, Response } from "express";
import { Prisma, PrismaClient, Role, Department, ExperienceLevel } from "@prisma/client";
import { z } from "zod";
import { addressSchema } from "./auth";

const prisma = new PrismaClient();

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// Whitelisted fields the caller is allowed to sort by.
const SORTABLE_FIELDS = ["createdAt", "email", "role", "department", "experienceLevel"] as const;

const listUsersQuerySchema = z.object({
  page:            z.coerce.number().int().min(1).optional().default(1),
  pageSize:        z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional().default(DEFAULT_PAGE_SIZE),
  // ── Filters ──
  role:            z.nativeEnum(Role).optional(),
  department:      z.nativeEnum(Department).optional(),
  experienceLevel: z.nativeEnum(ExperienceLevel).optional(),
  // Case-insensitive substring match against email and teamName.
  search:          z.string().trim().min(1).optional(),
  // ── Sorting ──
  sortBy:          z.enum(SORTABLE_FIELDS).optional().default("createdAt"),
  sortOrder:       z.enum(["asc", "desc"]).optional().default("asc"),
});

// Only these fields may be self-updated by the logged-in user. Anything else
// (role, department, experienceLevel, email, etc.) is rejected by .strict().
// `addresses`, when present, fully replaces the user's existing address list —
// callers must resend every address they want to keep.
const updateMeSchema = z
  .object({
    teamName: z.string().max(100).optional(),
    bio: z.string().max(250).optional(),
    addresses: z.array(addressSchema).optional(),
  })
  .strict();

const SELECT_SAFE_FIELDS = {
  id:              true,
  email:           true,
  role:            true,
  department:      true,
  experienceLevel: true,
  teamName:        true,
  bio:             true,
  birthdate:       true,
  createdAt:       true,
  addresses:       true,
} as const;

export async function updateMe(req: Request, res: Response): Promise<void> {
  const result = updateMeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: "Validation error", errors: result.error.flatten().fieldErrors });
    return;
  }

  const data: Prisma.UserUpdateInput = {};
  if (result.data.teamName !== undefined) data.teamName = result.data.teamName.trim() || null;
  if (result.data.bio !== undefined) data.bio = result.data.bio.trim() || null;
  if (result.data.addresses !== undefined) {
    data.addresses = { deleteMany: {}, create: result.data.addresses };
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ message: "No valid fields to update" });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.user!.sub },
    data,
    select: SELECT_SAFE_FIELDS,
  });

  res.json({ user });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const result = listUsersQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ message: "Validation error", errors: result.error.flatten().fieldErrors });
    return;
  }

  const { page, pageSize, role, department, experienceLevel, search, sortBy, sortOrder } = result.data;

  const where: Prisma.UserWhereInput = {
    ...(role && { role }),
    ...(department && { department }),
    ...(experienceLevel && { experienceLevel }),
    ...(search && {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { teamName: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Prisma.UserOrderByWithRelationInput = { [sortBy]: sortOrder };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id:              true,
        email:           true,
        role:            true,
        department:      true,
        experienceLevel: true,
        teamName:        true,
        bio:             true,
        birthdate:       true,
        createdAt:       true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    sort: { sortBy, sortOrder },
    filters: {
      role:            role ?? null,
      department:      department ?? null,
      experienceLevel: experienceLevel ?? null,
      search:          search ?? null,
    },
  });
}
