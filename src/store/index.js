import { createNamespacedHelpers } from 'vuex';

export * from './modules';

export const helpers = { ...createNamespacedHelpers('qx') };
