-- CreateEnum
CREATE TYPE "Slot" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "TrialOutcome" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('A', 'B', 'DRAW');

-- CreateEnum
CREATE TYPE "MatchupStatus" AS ENUM ('IN_PROGRESS', 'VOTING', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpointUrl" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchups" (
    "id" TEXT NOT NULL,
    "status" "MatchupStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workerId" TEXT NOT NULL,

    CONSTRAINT "matchups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchup_arms" (
    "id" TEXT NOT NULL,
    "slot" "Slot" NOT NULL,
    "trialsRequired" INTEGER NOT NULL DEFAULT 5,
    "matchupId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,

    CONSTRAINT "matchup_arms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trials" (
    "id" TEXT NOT NULL,
    "trialIndex" INTEGER NOT NULL,
    "outcome" "TrialOutcome",
    "naturalness" INTEGER,
    "audioQuality" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "matchupId" TEXT NOT NULL,
    "armId" TEXT NOT NULL,

    CONSTRAINT "trials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchup_votes" (
    "id" TEXT NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    "rationale" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchupId" TEXT NOT NULL,

    CONSTRAINT "matchup_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_ratings" (
    "id" TEXT NOT NULL,
    "eloScore" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "btStrength" DOUBLE PRECISION,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelId" TEXT NOT NULL,

    CONSTRAINT "model_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "models_name_key" ON "models"("name");

-- CreateIndex
CREATE INDEX "matchups_status_idx" ON "matchups"("status");

-- CreateIndex
CREATE INDEX "matchups_workerId_idx" ON "matchups"("workerId");

-- CreateIndex
CREATE INDEX "matchup_arms_modelId_idx" ON "matchup_arms"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "matchup_arms_matchupId_slot_key" ON "matchup_arms"("matchupId", "slot");

-- CreateIndex
CREATE INDEX "trials_armId_idx" ON "trials"("armId");

-- CreateIndex
CREATE INDEX "trials_matchupId_trialIndex_idx" ON "trials"("matchupId", "trialIndex");

-- CreateIndex
CREATE UNIQUE INDEX "matchup_votes_matchupId_key" ON "matchup_votes"("matchupId");

-- CreateIndex
CREATE INDEX "model_ratings_modelId_computedAt_idx" ON "model_ratings"("modelId", "computedAt");

-- AddForeignKey
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup_arms" ADD CONSTRAINT "matchup_arms_matchupId_fkey" FOREIGN KEY ("matchupId") REFERENCES "matchups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup_arms" ADD CONSTRAINT "matchup_arms_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trials" ADD CONSTRAINT "trials_matchupId_fkey" FOREIGN KEY ("matchupId") REFERENCES "matchups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trials" ADD CONSTRAINT "trials_armId_fkey" FOREIGN KEY ("armId") REFERENCES "matchup_arms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup_votes" ADD CONSTRAINT "matchup_votes_matchupId_fkey" FOREIGN KEY ("matchupId") REFERENCES "matchups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_ratings" ADD CONSTRAINT "model_ratings_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
