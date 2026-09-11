"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { permissionCatalog } from "@/modules/auth/permissions/permission-catalog";
import { requirePermission } from "@/modules/auth/server/auth-guards";

const permissionKeys = new Set<string>(permissionCatalog.map(({ key }) => key));

function values(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

function roleKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const roleSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(240).optional(),
  baseRole: z.nativeEnum(UserRole),
});

async function validatedPermissionIds(
  keys: string[],
  actorPermissions: readonly string[],
  existingPermissions: readonly string[] = [],
) {
  const actorSet = new Set(actorPermissions);
  const existingSet = new Set(existingPermissions);
  if (
    keys.some(
      (key) =>
        !permissionKeys.has(key) ||
        (!actorSet.has(key) && !existingSet.has(key)),
    )
  ) {
    throw new Error("invalid_permission");
  }

  const permissions = await prisma.permission.findMany({
    where: { key: { in: keys } },
    select: { id: true },
  });

  if (permissions.length !== new Set(keys).size) throw new Error("invalid_permission");
  return permissions.map(({ id }) => id);
}

export async function createRoleAction(formData: FormData) {
  const actor = await requirePermission("roles.manage");
  const parsed = roleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    baseRole: formData.get("baseRole"),
  });
  if (!parsed.success) return;
  if (parsed.data.baseRole === UserRole.SUPERADMIN && actor.accessRoleKey !== "SUPERADMIN") return;

  const selectedKeys = values(formData, "permissions");
  const permissionIds = await validatedPermissionIds(selectedKeys, actor.permissionKeys);
  const baseKey = roleKey(parsed.data.name);
  if (!baseKey) return;

  let key = baseKey;
  let suffix = 2;
  while (await prisma.role.findUnique({ where: { key }, select: { id: true } })) {
    key = `${baseKey}_${suffix++}`;
  }

  await prisma.role.create({
    data: {
      key,
      ...parsed.data,
      permissions: {
        create: permissionIds.map((permissionId) => ({ permissionId })),
      },
    },
  });
  revalidatePath("/dashboard/roles");
  revalidatePath("/dashboard/users");
}

export async function updateRoleAction(formData: FormData) {
  const actor = await requirePermission("roles.manage");
  const id = String(formData.get("id") ?? "");
  const parsed = roleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    baseRole: formData.get("baseRole"),
  });
  if (!id || !parsed.success) return;

  const role = await prisma.role.findUnique({
    where: { id },
    select: {
      key: true,
      isProtected: true,
      permissions: { select: { permission: { select: { key: true } } } },
    },
  });
  if (!role) return;
  if (role.key === "SUPERADMIN" && actor.accessRoleKey !== "SUPERADMIN") return;
  if (parsed.data.baseRole === UserRole.SUPERADMIN && actor.accessRoleKey !== "SUPERADMIN") return;

  let selectedKeys = values(formData, "permissions");
  if (role.key === "SUPERADMIN") {
    selectedKeys = permissionCatalog.map(({ key }) => key);
  }
  const existingKeys = role.permissions.map(({ permission }) => permission.key);
  const permissionIds = await validatedPermissionIds(
    selectedKeys,
    actor.permissionKeys,
    existingKeys,
  );

  if (
    actor.accessRoleId === id &&
    (!selectedKeys.includes("dashboard.access") ||
      !selectedKeys.includes("roles.manage"))
  ) {
    return;
  }

  await prisma.$transaction([
    prisma.role.update({
      where: { id },
      data: {
        name: role.isProtected ? undefined : parsed.data.name,
        description: parsed.data.description,
        baseRole: role.isProtected ? undefined : parsed.data.baseRole,
        isActive: role.isProtected ? true : formData.get("isActive") === "on",
      },
    }),
    prisma.rolePermission.deleteMany({ where: { roleId: id } }),
    prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
      skipDuplicates: true,
    }),
  ]);

  revalidatePath("/dashboard/roles");
  revalidatePath("/dashboard");
}

export async function deleteRoleAction(formData: FormData) {
  await requirePermission("roles.manage");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const role = await prisma.role.findUnique({
    where: { id },
    select: {
      isProtected: true,
      _count: { select: { users: true, invitations: true } },
    },
  });
  if (!role || role.isProtected || role._count.users > 0 || role._count.invitations > 0) return;

  await prisma.role.delete({ where: { id } });
  revalidatePath("/dashboard/roles");
}

