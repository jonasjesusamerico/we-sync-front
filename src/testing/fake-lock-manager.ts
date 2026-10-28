import { LockManagerLike } from '../app/core/auth/locks';

interface Waiter {
  start: () => void;
  cancel: (reason: unknown) => void;
}

/**
 * Lock exclusivo por nome, com fila FIFO real (o próximo callback só começa quando a promise do anterior termina)
 * e respeito ao `signal`. Uma instância compartilhada entre vários injetores simula várias abas.
 */
export class FakeLockManager implements LockManagerLike {
  private readonly held = new Set<string>();
  private readonly queues = new Map<string, Waiter[]>();

  request<T>(
    name: string,
    options: { mode: 'exclusive'; signal?: AbortSignal },
    callback: () => Promise<T>,
  ): Promise<T> {
    const { signal } = options;
    if (signal?.aborted) {
      return Promise.reject(signal.reason);
    }
    return new Promise<T>((resolve, reject) => {
      const onAbort = () => {
        const queue = this.queues.get(name) ?? [];
        const index = queue.indexOf(waiter);
        if (index >= 0) {
          queue.splice(index, 1);
          waiter.cancel(signal?.reason);
        }
      };
      const waiter: Waiter = {
        start: () => {
          signal?.removeEventListener('abort', onAbort);
          this.held.add(name);
          Promise.resolve()
            .then(callback)
            .then(resolve, reject)
            .finally(() => this.release(name));
        },
        cancel: (reason) => reject(reason),
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      if (this.held.has(name)) {
        const queue = this.queues.get(name) ?? [];
        queue.push(waiter);
        this.queues.set(name, queue);
      } else {
        waiter.start();
      }
    });
  }

  private release(name: string): void {
    this.held.delete(name);
    const next = this.queues.get(name)?.shift();
    next?.start();
  }
}
