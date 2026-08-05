import { GasUser } from '../services/gas.service';
import { User, UserRole } from '../types';

export const mapGasRole = (role: GasUser['role']): UserRole => {
  switch (role) {
    case 'Convenor':
      return 'admin';
    case 'Greenroom':
      return 'greenroom';
    case 'Judge':
      return 'judge';
    case 'TeamLeader':
    case 'Student':
      return 'teamleader';
    default:
      return 'teamleader';
  }
};

export const mapGasUser = (gasUser: GasUser): User => ({
  uid: gasUser.userId,
  username: gasUser.username,
  role: mapGasRole(gasUser.role),
  festId: 'default-fest-id',
  displayName: gasUser.displayName || gasUser.username,
  teamName: gasUser.teamName || gasUser.teamId,
  judgePanel: gasUser.judgePanel,
});
