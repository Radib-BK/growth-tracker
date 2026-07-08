import { Request, Response } from "express";
import { Prisma, PrismaClient, Role, Department, ExperienceLevel } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const PAGE_SIZE = 10;

// Whitelisted fields the caller is allowed to sort by.
const SORTABLE_FIELDS = ["createdAt", "email", "role", "department", "experienceLevel"] as const;

const listUsersQuerySchema = z.object({
  page:            z.coerce.number().int().min(1).optional().default(1),
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

export async function listUsers(req: Request, res: Response): Promise<void> {
  const result = listUsersQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ message: "Validation error", errors: result.error.flatten().fieldErrors });
    return;
  }

  const { page, role, department, experienceLevel, search, sortBy, sortOrder } = result.data;

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
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
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
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
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
