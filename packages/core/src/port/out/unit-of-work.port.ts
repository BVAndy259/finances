export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');

export interface UnitOfWorkPort {
  run<T>(work: () => Promise<T>): Promise<T>;
}
