-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reglement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amountDue" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "comment" TEXT,
    "relanceCount" INTEGER NOT NULL DEFAULT 0,
    "lastRelanceAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "patientId" TEXT NOT NULL,
    CONSTRAINT "Reglement_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reglement" ("amountDue", "createdAt", "dueDate", "id", "patientId", "status", "updatedAt") SELECT "amountDue", "createdAt", "dueDate", "id", "patientId", "status", "updatedAt" FROM "Reglement";
DROP TABLE "Reglement";
ALTER TABLE "new_Reglement" RENAME TO "Reglement";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
