import { expose } from 'comlink';
import { api } from './api';

export type CalcWorkerApi = typeof api;
export type { CalcWorkerFlush } from './protocol';

expose(api);

