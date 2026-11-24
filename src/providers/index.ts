import type { Provider } from '../types.ts';
import { paystack } from './paystack.ts';
import { stripe } from './stripe.ts';

// To add a provider: write a file like paystack.ts, a reference and broken versions in src/references/, and list it here.
export const providers: Record<string, Provider> = { paystack, stripe };
