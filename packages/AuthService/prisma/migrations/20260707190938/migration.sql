/*
  Warnings:

  - The values [INVALID_EMAIL] on the enum `login_failure_reason` will be removed. If these variants are still used in the database, this will fail.
  - The `asn` column on the `login_history` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `last_used_at` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the `trusted_devices` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "login_failure_reason_new" AS ENUM ('INVALID_CREDENTIALS', 'MFA_NOT_CONFIGURED', 'CAPTCHA_INVALID', 'ACCOUNT_LOCKED', 'MFA_INVALID', 'MFA_REQUIRED', 'CAPTCHA_REQUIRED', 'INVALID_CHALLENGE_EMAIL', 'UNKNOWN');
ALTER TABLE "login_history" ALTER COLUMN "failure_reason" TYPE "login_failure_reason_new" USING ("failure_reason"::text::"login_failure_reason_new");
ALTER TYPE "login_failure_reason" RENAME TO "login_failure_reason_old";
ALTER TYPE "login_failure_reason_new" RENAME TO "login_failure_reason";
DROP TYPE "public"."login_failure_reason_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "trusted_devices" DROP CONSTRAINT "trusted_devices_device_id_fkey";

-- DropIndex
DROP INDEX "devices_last_seen_at_idx";

-- DropIndex
DROP INDEX "devices_user_id_fingerprint_hash_key";

-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "last_user_agent" TEXT,
ALTER COLUMN "fingerprint_hash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "login_history" DROP COLUMN "asn",
ADD COLUMN     "asn" INTEGER,
ALTER COLUMN "user_agent" DROP NOT NULL;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "last_used_at";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "name" VARCHAR(100) NOT NULL;

-- DropTable
DROP TABLE "trusted_devices";
