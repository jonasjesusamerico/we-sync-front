import { LockManagerLike } from '../app/core/auth/lock-manager';

interface Waiter {
  run: () => void;
  abort: () => void;
}

/** Web Locks stand-in for unit tests: one holder per name, FIFO, honours the abort signal. */
export class FakeLockManager implements LockManagerLike {
  private readonly queues = new Map<string, Waiter[]>();
  private readonly holders = new Set<string>();

  request<T>(name: string, options: { signal: AbortSignal }, task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const { signal } = options;
      if (signal.aborted) {
        reject(signal.reason);
        return;
      }
      const waiter: Waiter = {
        run: () => {
          signal.removeEventListener('abort', onAbort);
          this.holders.add(name);
          task()
            .then(resolve, reject)
            .finally(() => {
              this.holders.delete(name);
              this.next(name);
            });
        },
        abort: () => reject(signal.reason),
      };
      const onAbort = () => {
        const queue = this.queues.get(name) ?? [];
        const index = queue.indexOf(waiter);
        if (index >= 0) {
          queue.splice(index, 1);
          waiter.abort();
        }
      };
      signal.addEventListener('abort', onAbort);
      const queue = this.queues.get(name) ?? [];
      queue.push(waiter);
      this.queues.set(name, queue);
      if (!this.holders.has(name)) {
        this.next(name);
      }
    });
  }

  held(name: string): boolean {
    return this.holders.has(name);
  }

  waiting(name: string): number {
    return this.queues.get(name)?.length ?? 0;
  }

  private next(name: string): void {
    const waiter = this.queues.get(name)?.shift();
    waiter?.run();
  }
}
