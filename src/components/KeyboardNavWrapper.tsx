import { ReactNode } from 'react';
import { useKeyboardNav } from '../hooks/useKeyboardNav';

export default function KeyboardNavWrapper({ children }: { children: ReactNode }) {
  useKeyboardNav();
  return <>{children}</>;
}
