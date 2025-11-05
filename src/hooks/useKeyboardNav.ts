import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MINISTRIES } from '../types';

/**
 * Keyboard navigation hook
 * Spec §8.4: 1-9/A-Z for ministries, G/B/R/D for pages
 */
export function useKeyboardNav() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toUpperCase();

      // Page navigation (G/B/R/D)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (key) {
          case 'G':
            navigate('/');
            break;
          case 'B':
            navigate('/budget');
            break;
          case 'R':
            navigate('/report');
            break;
          case 'D':
            navigate('/data');
            break;
        }

        // Ministry navigation (1-9, A-M for 13 ministries)
        const ministryMap: Record<string, number> = {
          '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
          '6': 5, '7': 6, '8': 7, '9': 8,
          'A': 9, 'Z': 10, 'E': 11, 'T': 12,
        };

        const ministryIndex = ministryMap[key];
        if (ministryIndex !== undefined && ministryIndex < MINISTRIES.length) {
          navigate(`/ministry/${MINISTRIES[ministryIndex]}`);
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [navigate]);
}
