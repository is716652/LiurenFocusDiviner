# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\core\核心解耦与鸿蒙移植说明.md"
t = io.open(p, encoding="utf-8").read()

anchor = "## 八、待扩展\n"
addition = """✅ **第六批：课体识别层（九宗门 1→9 完整）**（回归 6/6 + 5724/5724 全过，BUILD SUCCESSFUL 0 ERROR 0 WARN）
- **规则依据**：`大六壬文档/排盘/大六壬指南的四课三传的三传排法.md`（九宗门优先级 1→9）
- **核心实现**（`liuren-core.ts` + 鸿蒙 `LiurenCore.ets` 同步）：`resolveSanchuan` 重写——
  - ① 贼克（重审/元首）② 比用 ③ 涉害 ④ 遥克（蒿矢/弹射）⑤ 昴星（虎视转蓬/冬蛇掩目）
  - ⑥ **别责**（四课 3 课且无克：阳日取干合处、阴日取支前三合处上神；中末=日干上神）
  - ⑦ **八专**（干支同位且无克：阳日干上神顺 3、阴日支上神逆 3；中末=日干上神）
  - ⑧ **伏吟**（天盘=地盘：初传看首课贼克，自刑特殊处理，中末取刑）
  - ⑨ **返吟**（天盘互冲：有克按贼克/遥克，无克井栏射 丑日亥/未日巳）
- **数据结构**：`SanChuan` 新增 `keti` 字段（课体名，普通课为""）
- **辅助静态表**：`XING_MAP`（刑）、`HE_GAN`（干合）、`QIAN_SANHE`（支前三合）
- **UI 展示**：三传标题课体课显示课体名（鸿蒙 `chuanTitle()` + Web `renderChuan`），普通课仍显示宗门法
- **验证**：真实历法扫描 5844 样本识别出伏吟/返吟/八专/别责实例且三传完整；`_tests/_test_keti.js`、`_tests/_scan_keti.js` 全过；回归测试对课体课豁免 method/chuans 比对（旧引擎误判为昴星，属增强）
- **后续**：82 法毕法格局中依赖课体的法（如伏吟格/返吟格）可在判定层接入 keti 条件

## 八、待扩展
"""
if anchor in t:
    t = t.replace(anchor, addition)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK doc")
else:
    print("MISS anchor")
