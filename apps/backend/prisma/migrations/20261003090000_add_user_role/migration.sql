CREATE TYPE "UserRole" AS ENUM ('player', 'admin');

ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'player';
