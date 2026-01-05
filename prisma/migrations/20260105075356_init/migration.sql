-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT,
    "parentId" TEXT,
    "order" SERIAL NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "menus_path_key" ON "menus"("path");

-- CreateIndex
CREATE INDEX "menus_parentId_idx" ON "menus"("parentId");

-- CreateIndex
CREATE INDEX "menus_order_idx" ON "menus"("order");

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
