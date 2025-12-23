-- AlterTable
ALTER TABLE "public"."EmailVerificationToken" ADD COLUMN     "uuid" UUID NOT NULL DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "uuid" UUID NOT NULL DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "public"."GameRecord" ADD COLUMN     "uuid" UUID NOT NULL DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "uuid" UUID NOT NULL DEFAULT gen_random_uuid();
