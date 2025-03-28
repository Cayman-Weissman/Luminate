import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * A hook that scrolls the window to the top when the location changes
 */
export function useScrollTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

export default useScrollTop;