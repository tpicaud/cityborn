import { z } from 'zod';

export const CompatPolicySchema = z.object({
  min_days_supported: z.number(),
  min_num_of_version_supported: z.number(),
});

export type CompatPolicy = z.infer<typeof CompatPolicySchema>;

export const ManifestEntrySchema = z
  .object({
    file: z.string(),
    versionNumber: z.number(),
    releasedAt: z.string(),
    draft: z.boolean().optional(),
    deprecatedAt: z.string().optional(),
    deprecationReason: z.string().min(1).optional(),
  })
  .strict()
  .refine(
    (entry) =>
      entry.deprecatedAt === undefined || entry.deprecationReason !== undefined,
    {
      message:
        'deprecationReason is required when deprecatedAt is set (explain why it is safe to stop supporting this version).',
    },
  );

export type ManifestEntry = z.infer<typeof ManifestEntrySchema>;

export const ManifestSchema = z.object({
  versions: z.array(ManifestEntrySchema),
});

export type Manifest = z.infer<typeof ManifestSchema>;

export interface OasdiffChange {
  id: string;
  text: string;
  level: number;
  operation?: string;
  path?: string;
  source?: string;
}

export interface VersionCheckResult {
  entry: ManifestEntry;
  breaking: boolean;
  changes: OasdiffChange[];
}

export interface CompatReport {
  checked: VersionCheckResult[];
  brokenAt?: VersionCheckResult;
  skippedDeprecated: ManifestEntry[];
}
