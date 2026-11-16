// 所有修改入口必须先检查预览锁，不能仅依赖 CSS。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const code = fs.readFileSync(path.join(__dirname, "../pages/gallery_setup.js"), "utf8");
const names = ["addGlobalTier","removeTier","updateTier","addCustomTag","updateCustomTag","removeCustomTag","addNewCategory","deleteCategory","openAddItemModal","openEditItemModal","saveItemData","deleteItem","deleteEntireGame","updateCategoryName","updateCustomPoolName","openAddPoolModal","deleteCustomPool","handleEngineConfigImport","importFromExistingPreset"];
for (const name of names) {
    const match = code.match(new RegExp("window\\." + name + " = (?:async )?function"));
    const start = match ? match.index : -1;
    const end = code.indexOf("if (galleryPreviewLock.isLocked()) return;", start);
    assert.ok(start >= 0 && end > start && end - start < 260, name + " 必须先检查锁定");
    const prefix = code.slice(start, end + "if (galleryPreviewLock.isLocked()) return;".length);
    const context = vm.createContext({ window: {}, galleryPreviewLock: { isLocked: () => true } });
    vm.runInContext(prefix + "\nthrow Error(\"不应进入修改逻辑\"); };", context);
    context.window[name]();
}
console.log("PASS：预览下所有增删、编辑、导入入口直接调用均被拦截");
