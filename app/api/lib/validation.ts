import { z } from 'zod';

import { parseTonAddress } from './tonAddress';

export const tonAddressSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .transform((v) => parseTonAddress(v))
  .refine((v) => v !== null, { message: 'Invalid TON address' })
  .transform((v) => v!);

export const walletAddressQuerySchema = z.object({
  address: z.string().trim().min(1),
});

