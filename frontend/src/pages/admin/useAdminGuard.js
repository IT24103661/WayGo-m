import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useAdminGuard() {
  const navigate = useNavigate();
  useEffect(() => {
    const role = localStorage.getItem('waygo_role');
    if (role !== 'SystemAdmin' && role !== 'Admin') navigate('/login', { replace: true });
  }, [navigate]);
}
