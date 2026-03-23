import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const useAuth = () => {
  const { user, token, loading, error } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  const requireAuth = (callback) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (callback) callback();
  };

  const requireAdmin = (callback) => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    if (callback) callback();
  };

  return { user, token, loading, error, isAdmin, isAuthenticated, requireAuth, requireAdmin };
};

export default useAuth;
