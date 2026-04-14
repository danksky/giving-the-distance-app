-- CreateTable
CREATE TABLE "activity_notifications" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_notifications_activityId_type_key" ON "activity_notifications"("activityId", "type");

-- CreateIndex
CREATE INDEX "activity_notifications_activityId_idx" ON "activity_notifications"("activityId");

-- CreateIndex
CREATE INDEX "activity_notifications_type_idx" ON "activity_notifications"("type");

-- CreateIndex
CREATE INDEX "activity_notifications_status_idx" ON "activity_notifications"("status");

-- AddForeignKey
ALTER TABLE "activity_notifications" ADD CONSTRAINT "activity_notifications_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
