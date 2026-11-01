import { describe, it, expect, vi } from 'vitest';

vi.mock('../../components/ui/AppDialog', () => ({ appDialog: { alert: vi.fn() } }));

import { buildParticipantRemoval } from '../participantRemoval';
import { describeError, reportError } from '../errorReporting';
import { appDialog } from '../../components/ui/AppDialog';

const prog = (id: string, teams: any[]) => ({ id, teams } as any);

describe('buildParticipantRemoval (delete a student everywhere)', () => {
  it('removes the chest number from programs and the student register in one payload', () => {
    const programs = [
      prog('p1', [{ teamName: 'Red', participants: [{ chestNumber: '101' }, { chestNumber: '102' }] }]),
      prog('p2', [{ teamName: 'Red', participants: [{ chestNumber: '101' }] }, { teamName: 'Blue', participants: [{ chestNumber: '201' }] }]),
      prog('p3', [{ teamName: 'Blue', participants: [{ chestNumber: '201' }] }])
    ];
    const { payload, programCount, studentCount } = buildParticipantRemoval(programs, [{ id: 's1', chestNumber: '101' }, { id: 's2', chestNumber: '201' }], '101');
    expect(programCount).toBe(2);
    expect(studentCount).toBe(1);
    expect(payload['programs/p1/teams']).toEqual([{ teamName: 'Red', participants: [{ chestNumber: '102' }] }]);
    expect(payload['programs/p2/teams']).toEqual([{ teamName: 'Blue', participants: [{ chestNumber: '201' }] }]); // empty Red team dropped
    expect(payload['students/s1']).toBeNull();
    expect('programs/p3/teams' in payload).toBe(false);
    expect('students/s2' in payload).toBe(false);
  });

  it('finds a student who is only in the register (bulk-added, no programs yet)', () => {
    const { payload, programCount, studentCount } = buildParticipantRemoval([], [{ id: 's9', chestNumber: '900' }], '900');
    expect(programCount).toBe(0);
    expect(studentCount).toBe(1);
    expect(payload).toEqual({ 'students/s9': null });
  });

  it('removes the teams node when the last team becomes empty', () => {
    const { payload } = buildParticipantRemoval([prog('p1', [{ teamName: 'Red', participants: [{ chestNumber: '101' }] }])], [], '101');
    expect(payload['programs/p1/teams']).toBeNull();
  });
});

describe('error messages shown to users', () => {
  it('explains common failures in plain language', () => {
    expect(describeError({ code: 'PERMISSION_DENIED', message: 'PERMISSION_DENIED: Permission denied' })).toMatch(/permission/i);
    expect(describeError({ code: 'functions/internal', message: 'internal' })).toMatch(/not be deployed/);
    expect(describeError({ message: 'Failed to fetch' })).toMatch(/internet/);
    expect(describeError({ message: 'Something specific' })).toBe('Something specific');
  });

  it('always shows a dialog, but only once for the same repeated failure', () => {
    const alert = vi.mocked(appDialog.alert);
    alert.mockClear();
    expect(reportError('Program not updated', { message: 'boom' })).toBe(false);
    reportError('Program not updated', { message: 'boom' });
    expect(alert).toHaveBeenCalledTimes(1);
    reportError('Program not deleted', { message: 'boom' });
    expect(alert).toHaveBeenCalledTimes(2);
  });
});
