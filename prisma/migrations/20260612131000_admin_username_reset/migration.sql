ALTER TABLE "AdminAccount" ADD COLUMN "username" TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE "AdminAccount" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdminAccount" ADD COLUMN "resetTokenHash" TEXT;
ALTER TABLE "AdminAccount" ADD COLUMN "resetTokenExpiresAt" DATETIME;

CREATE UNIQUE INDEX "AdminAccount_username_key" ON "AdminAccount"("username");
