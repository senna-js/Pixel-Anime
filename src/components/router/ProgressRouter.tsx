import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  easing: 'ease',
  speed: 300,
  minimum: 0.1
});

interface ProgressRouterProps {
  children: ReactNode;
}

const ProgressRouter: React.FC<ProgressRouterProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Always finish any previous progress before starting a new one
    NProgress.done();
    
    // Start progress bar
    NProgress.start();

    // Complete progress bar after a short delay to ensure it's visible
    const timer = setTimeout(() => {
      NProgress.done();
    }, 400); // Slightly longer delay to ensure animation completes

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname]);

  return <>{children}</>;
};

export default ProgressRouter; 