/** State of an area that loads on its own (RF-25, RN-26). */
export type Loadable<T> =
  { status: 'loading' } | { status: 'ready'; value: T } | { status: 'error'; message: string };

export const LOADING: Loadable<never> = { status: 'loading' };
