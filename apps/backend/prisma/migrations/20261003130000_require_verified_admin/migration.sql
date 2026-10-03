ALTER TABLE "User" ADD CONSTRAINT "User_admin_requires_verified_email" CHECK ("role" <> 'admin' OR "isVerified");
