/** What `Map` and `WeakMap` share. */
interface PromiseCache<K, T> {
  delete: (key: K) => boolean;
  get: (key: K) => Promise<T> | undefined;
  set: (key: K, value: Promise<T>) => void;
}

/** The pending or settled promise for `key`. A rejection is evicted, so the next call asks again. */
export const cached = <K, T>(
  cache: PromiseCache<K, T>,
  key: K,
  create: () => Promise<T>
) => {
  let promise = cache.get(key);

  if (promise === undefined) {
    promise = (async () => {
      try {
        return await create();
      } catch (error) {
        cache.delete(key);
        throw error;
      }
    })();
    cache.set(key, promise);
  }

  return promise;
};
