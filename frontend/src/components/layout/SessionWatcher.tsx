import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { AUTH_EXPIRED_EVENT } from '../../services/api';

/**
 * Nghe su kien het phien tu api.ts: dang xuat, xoa cache, ve trang dang nhap va NHO trang dang dung
 * (state.from) de dang nhap lai xong quay ve dung cho do - vd link ung vien dong nghiep gui.
 */
export default function SessionWatcher() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  // Handler dang ky 1 lan nhung can gia tri moi nhat
  const latest = useRef({ user, location });
  latest.current = { user, location };
  // Trang thuong goi vai API song song -> vai 401 den TRUOC khi React kip render lai sau logout().
  // Chi dua vao user trong ref la khong du (3 thong bao trung) -> danh dau ngay khi xu ly lan dau.
  const handled = useRef(false);
  useEffect(() => {
    if (user) handled.current = false; // dang nhap lai -> lan het phien sau van duoc xu ly
  }, [user]);

  useEffect(() => {
    const onExpired = () => {
      const { user: current, location: here } = latest.current;
      if (!current || handled.current) return;
      handled.current = true;
      logout();
      queryClient.clear();
      toast.warning('Phiên đăng nhập đã hết hạn', {
        id: 'session-expired',
        description: 'Đăng nhập lại để tiếp tục đúng chỗ bạn đang làm.',
      });
      navigate('/login', { replace: true, state: { from: here } });
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [logout, navigate, queryClient]);

  return null;
}
