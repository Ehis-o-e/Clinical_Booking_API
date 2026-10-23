CREATE TABLE "booking_rate_limits" (
    "email" TEXT NOT NULL,

    CONSTRAINT "booking_rate_limits_pkey" PRIMARY KEY ("email")
);

CREATE TABLE "booking_rate_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_rate_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "booking_rate_attempts_email_created_at_idx"
ON "booking_rate_attempts"("email", "created_at");
