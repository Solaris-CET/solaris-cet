import { describe, expect, it } from 'vitest';

import { adminRoleRank, buildAdminNav, canAccessAdminSection } from '@/admin/adminNav';

describe('adminNav', () => {
  it('buildAdminNav includes twin and survey-offline sections', () => {
    const keys = buildAdminNav(0).map((i) => i.key);
    expect(keys).toContain('twin-agent');
    expect(keys).toContain('survey-offline');
  });

  it('buildAdminNav shows new leads count in label', () => {
    const leads = buildAdminNav(3).find((i) => i.key === 'leads');
    expect(leads?.label).toContain('(3)');
  });

  it('canAccessAdminSection respects role hierarchy', () => {
    expect(canAccessAdminSection('admin', 'editor')).toBe(true);
    expect(canAccessAdminSection('viewer', 'admin')).toBe(false);
    expect(canAccessAdminSection('editor', 'editor')).toBe(true);
  });

  it('adminRoleRank orders admin above editor above viewer', () => {
    expect(adminRoleRank('admin')).toBeGreaterThan(adminRoleRank('editor'));
    expect(adminRoleRank('editor')).toBeGreaterThan(adminRoleRank('viewer'));
  });
});