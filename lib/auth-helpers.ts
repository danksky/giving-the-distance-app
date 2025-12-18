/**
 * Auth Helper Functions
 */

/**
 * Check if an email is in the admin list
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const adminEmails = process.env.ADMIN_EMAILS || '';
  const adminList = adminEmails
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);
  
  return adminList.includes(email.toLowerCase());
}

/**
 * Get list of admin emails (for display purposes)
 */
export function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS || '';
  return adminEmails
    .split(',')
    .map(e => e.trim())
    .filter(e => e.length > 0);
}
