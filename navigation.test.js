const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isWorkspaceUrl } = require('./navigation');
const { canUsePermission } = require('./navigation');
test('permissions check both origin and the current workspace page', () => {
  const o = 'https://ulizatickets.com', p = o + '/admin/whatsapp-chat';
  assert.equal(canUsePermission(o, p, 'media', o, ['audio']), true);
  assert.equal(canUsePermission(o, p, 'media', o, ['video']), false);
  assert.equal(canUsePermission('https://evil.example', p, 'media', o), false);
  assert.equal(canUsePermission(o, o + '/login', 'media', o), false);
  assert.equal(canUsePermission(o, o + '/admin/dashboard', 'notifications', o), false);
});
test('desktop window only opens chat workspace and authentication', () => {
  const origin = 'https://ulizatickets.com';
  for (const path of ['/admin/whatsapp-chat', '/admin/whatsapp-chat?view=crm', '/admin/whatsapp-chat/254700000000', '/login?redirect=%2Fadmin%2Fwhatsapp-chat']) assert.ok(isWorkspaceUrl(origin + path, origin));
  for (const url of [origin + '/admin/dashboard', origin + '/', origin + '/account', 'https://example.com/login', 'javascript:alert(1)', origin + '/admin/whatsapp-chat/../dashboard']) assert.equal(isWorkspaceUrl(url, origin), false);
});
