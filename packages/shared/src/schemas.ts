import { z } from "zod";

/** Stellar public key (G...) — 56 chars, base32 */
export const stellarAddressSchema = z
  .string()
  .trim()
  .regex(/^G[A-Z2-7]{55}$/, "Starts with G. Paste it from their wallet.");

/** Human-entered decimal amount, e.g. "300" or "300.50" (max 7 decimals, Stellar precision) */
export const decimalAmountSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,7})?$/, "Enter a valid amount")
  .refine((v) => Number(v) > 0, "Amount must be greater than 0");

export const milestoneInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(60),
  description: z.string().trim().max(500).optional(),
  amount: decimalAmountSchema,
});

/** Design + contract limit */
export const MAX_MILESTONES = 10;

export const createAgreementSchema = z.object({
  projectName: z.string().trim().min(1, "Project name is required").max(60),
  description: z.string().trim().max(500).optional(),
  contributor: stellarAddressSchema,
  milestones: z
    .array(milestoneInputSchema)
    .min(1, "Add at least one milestone")
    .max(MAX_MILESTONES),
});

export type MilestoneInput = z.infer<typeof milestoneInputSchema>;
export type CreateAgreementInput = z.infer<typeof createAgreementSchema>;

/** Off-chain metadata the frontend posts to the API after the on-chain create succeeds. */
export const agreementMetadataSchema = createAgreementSchema.extend({
  agreementId: z.string().regex(/^\d+$/),
  client: stellarAddressSchema,
  createdTxHash: z.string().regex(/^[a-f0-9]{64}$/i),
});
export type AgreementMetadataInput = z.infer<typeof agreementMetadataSchema>;

export const milestoneSubmissionSchema = z.object({
  submissionRef: z.string().trim().max(500).optional(),
});

/** Display profile per wallet (clients and contributors alike) */
export const profileSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters").max(40, "Keep it under 40 characters")
    .regex(/^[\p{L}\p{M}0-9 .'’-]+$/u, "Use letters, numbers, spaces, apostrophes, dots or dashes").optional(),
  /** Small square avatar as a data URL (≤ 300 KB), or null to remove */
  avatar: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/).max(300_000).nullable().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;
