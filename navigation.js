function isWorkspaceUrl(value, origin) {
  try {
    const url = new URL(value);
    return url.origin === origin && (
      /^\/admin\/whatsapp-chat(?:\/[1-9]\d{7,14})?\/?$/.test(url.pathname) ||
      ["/login", "/forgot-password", "/reset-password"].includes(url.pathname)
    );
  } catch { return false; }
}
function canUsePermission(origin, page, permission, appOrigin, mediaTypes = []) {
  try {
    return new URL(origin).origin === appOrigin && isWorkspaceUrl(page, appOrigin) &&
      new URL(page).pathname.startsWith('/admin/whatsapp-chat') &&
      ['media', 'notifications', 'clipboard-sanitized-write', 'fullscreen'].includes(permission) &&
      !(permission === 'media' && mediaTypes.includes('video'));
  } catch { return false; }
}
module.exports = { isWorkspaceUrl, canUsePermission };
