function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Promote user to admin if their email matches ADMIN_EMAILS (comma-separated list in .env).
 */
async function syncAdminRole(userDoc) {
  if (!userDoc || !userDoc.email) return userDoc;
  const emails = getAdminEmails();
  if (!emails.length) return userDoc;

  const lower = String(userDoc.email).toLowerCase();
  if (emails.includes(lower) && userDoc.role !== 'admin') {
    userDoc.role = 'admin';
    await userDoc.save();
  }
  return userDoc;
}

module.exports = { getAdminEmails, syncAdminRole };
