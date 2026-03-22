-- AlterTable
ALTER TABLE "trials" ADD COLUMN     "acousticNaturalness" INTEGER,
ADD COLUMN     "conversationalUsefulness" INTEGER,
ADD COLUMN     "hasPacketLoss" BOOLEAN,
ADD COLUMN     "perceivedNaturalness" INTEGER,
ADD COLUMN     "semanticClarity" INTEGER;
