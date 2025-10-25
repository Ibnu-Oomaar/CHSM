import prisma from './prisma'

// Check whether a user with a given role has a named permission
export async function hasPermissionByName(user: { id: string; role: string } | null, permissionName: string) {
  if (!user) return false
  // superAdmin has all permissions
  if (user.role === 'superAdmin') return true

  // check for a RolePermission linking this role to the named permission
  const found = await prisma.rolePermission.findFirst({
    where: {
      role: user.role as any,
      permission: { name: permissionName },
    },
    include: { permission: true },
  })
  return !!found
}

// Get permissions for a role
export async function getPermissionsForRole(role: string) {
  const items = await prisma.rolePermission.findMany({ where: { role: role as any }, include: { permission: true } })
  return items.map(i => i.permission)
}
