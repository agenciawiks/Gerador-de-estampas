import { useState, useEffect } from "react";

/**
 * Igual ao useState, mas guarda o valor no localStorage e o recupera ao
 * recarregar a página. `key` precisa ser único no app inteiro.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* localStorage indisponível (aba anônima, quota, etc.) — segue sem persistir */
    }
  }, [key, state]);

  return [state, setState] as const;
}
