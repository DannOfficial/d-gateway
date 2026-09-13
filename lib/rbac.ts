export type UserRole = 'user' | 'moderator' | 'admin' | 'superadmin' | 'owner'

export const ROLE_RANKS: Record<UserRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
  superadmin: 3,
  owner: 4,
}

export interface CheckPermissionParams {
  commandRole?: string
  userRole?: string
  isBotOwner?: boolean
}

export function checkCommandPermission({
  commandRole = 'user',
  userRole = 'user',
  isBotOwner = false,
}: CheckPermissionParams): { allowed: boolean; requiredRole: string; userRole: string } {
  if (isBotOwner) {
    return { allowed: true, requiredRole: commandRole, userRole: 'owner' }
  }

  const reqRank = ROLE_RANKS[(commandRole.toLowerCase() as UserRole) || 'user'] ?? 0
  const userRank = ROLE_RANKS[(userRole.toLowerCase() as UserRole) || 'user'] ?? 0

  return {
    allowed: userRank >= reqRank,
    requiredRole: commandRole,
    userRole: userRole,
  }
}
