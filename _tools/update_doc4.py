# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

old_block = """⏭️ **下一步**
1. ~~抓用神/读象 UI（占事 chips → 用神候选 → 动态三传 → 节点卡 → 管辂选句）~~ → ✅ 第三批已完成（见下）
2. 模拟器测试：`D:\\HarmonyOS\\command-line-tools\\bin\\Emulator.bat`
3. ~~Web 端选句逻辑抽入核心 `selectDuyu()`（两端共用）~~ → ✅ 已抽入 `YongShenCore.selectDuyu()`（鸿蒙侧；Web 端仍用 HTML 内联逻辑，待回填共用）"""

new_block = """⏭️ **下一步**
1. ~~抓用神/读象 UI（占事 chips → 用神候选 → 动态三传 → 节点卡 → 管辂选句）~~ → ✅ 第三批已完成（见下）
2. 模拟器测试：`D:\\HarmonyOS\\command-line-tools\\bin\\Emulator.bat`
3. ~~Web 端选句逻辑抽入核心 `selectDuyu()`（两端共用）~~ → ✅ 第四批已完成（见下）

✅ **第四批：Web 端回填核心（抓用神逻辑两端共用）**（回归 6/6 + 5724/5724 全过，HTML 语法检查通过）
- **核心真源** `core/liuren-core.ts` 末尾新增 `class YongShenCore`（与鸿蒙端 `model/YongShenCore.ets` 同构，ArkTS 兼容子集）：`affairs/affairByName/duyuOf`（占事解析+组合读象）、`candidates`（类神候选）、`dongtai`（动态三传）、`jieDianWords`（节点卡词云）、`selectDuyu(c,aff,cands,zhi,xiangyi,tick,anchor)`（打分/收光/命中依据，tick 支持 Web「🔄 换一条」、anchor 支持锚定象）
- **Web 端 HTML 改造**（`renderXiangyi/runLeishen/renderDongtai/jieDianWords/读象断语` 五处改为调核心；UI 渲染壳保留）：
  - `init` 后注入 `YongShenCore.zhanShi = window.ZHANSHI`
  - `renderXiangyi` → `YongShenCore.selectDuyu(...)`（原 HTML 内联打分/收光/命中依据删除）
  - `runLeishen` 候选生成 → `YongShenCore.candidates`（原 LIUQIN_ZHI 六亲表逻辑删）
  - `renderDongtai` → `YongShenCore.dongtai`（原六亲推导删）
  - `jieDianWords` → `YongShenCore.jieDianWords`（原类象库解析删）
  - 读象断语 → `YongShenCore.duyuOf`
  - 冗余常量（LIUQIN_ZHI/GUANLU_DUYU/AFFAIR_XIANGYI/AFFAIR_KW/TIANJIANG_LEIXIANG）保留为兼容（已无引用）
- **验证**：新增 `_test_selectDuyu.js`（vm 加载核心 + 真实 rawfile 数据）：12 大类解析/候选/三传/词云/选句/tick/anchor/duyuOf/12 占事全跑通，ALL PASS"""

if old_block in t:
    t = t.replace(old_block, new_block)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS doc block")
