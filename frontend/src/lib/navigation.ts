import type { Location } from 'react-router-dom';
import type { Role } from '../types';

export const homeOf = (role: Role) => (role === 'HR' ? '/hr' : '/jobs');

/**
 * Sau khi dang nhap: ve trang nguoi dung dinh vao truoc do (state.from) neu co, nguoc lai ve trang chinh.
 * Trang khong dung vai tro se bi Protected chuyen tiep ve trang chinh.
 */
export function postLoginPath(location: Location, role: Role): string {
  const from = (location.state as { from?: Location } | null)?.from;
  if (from && from.pathname !== '/login' && from.pathname !== '/register') {
    return from.pathname + from.search;
  }
  return homeOf(role);
}
