import { useEffect, useState, useCallback } from 'react';

/**
 * Custom countdown timer hook. Calculates remaining seconds until deadline.
 * Handles cleanup correctly for React StrictMode.
 * 
 * @param {number} deadline - The epoch millisecond timestamp representing the deadline.
 * @param {function} onExpire - Callback function triggered once the countdown reaches 0.
 */
export function useCountdown(deadline, onExpire) {
  const compute = useCallback(
    () => Math.max(0, Math.round((deadline - Date.now()) / 1000)),
    [deadline]
  );
  
  const [remaining, setRemaining] = useState(compute);

  useEffect(() => {
    setRemaining(compute());
    
    const id = setInterval(() => {
      const r = compute();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(id);
        onExpire();
      }
    }, 250);
    
    // Cleanup interval to avoid memory leaks and handle StrictMode double-invocation
    return () => clearInterval(id);
  }, [deadline, compute, onExpire]);

  return remaining;
}
export default useCountdown;
