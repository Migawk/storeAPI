-- RedefineIndex
DROP INDEX "Catalogue_href_key";
CREATE UNIQUE INDEX "Catalogue_slug_key" ON "Catalogue"("slug");

-- RedefineIndex
DROP INDEX "Product_href_key";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
