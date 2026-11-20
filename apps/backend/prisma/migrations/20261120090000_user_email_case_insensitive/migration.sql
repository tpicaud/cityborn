DROP INDEX "User_email_key";
CREATE UNIQUE INDEX "User_email_case_insensitive_key" ON "User" (lower("email"));
