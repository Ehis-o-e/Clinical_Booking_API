CREATE UNIQUE INDEX "Booking_one_confirmed_per_slot"
ON "Booking"("slot_id")
WHERE "status" = 'confirmed';
