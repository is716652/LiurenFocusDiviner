# -*- coding: utf-8 -*-
"""回归测试：移除依赖天将的比对字段（dx.guiren / dx.bifa）
贵人落宫规则修正（2026-08-18 第五批）后这些字段合理变化，由独立规则测试覆盖"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_tests\_test_core_regress.js"
t = io.open(p, encoding="utf-8").read()

pairs = [
    ("""  ['dx.guiren', (c) => c.dx.guiren],
  ['dx.guiren.zhu', (c) => c.dx.guiren.zhu],
  ['dx.shensha.byZhi', (c) => c.dx.shensha.byZhi],""",
     """  /* dx.guiren / dx.bifa 依赖天将布列（贵人落宫规则修正后合理变化），
     不在重构回归比对范围；由 _test_jiangpan_all.js 规则测试覆盖 */
  ['dx.shensha.byZhi', (c) => c.dx.shensha.byZhi],"""),
    ("""  ['dx.shensha.list', (c) => c.dx.shensha.list],
  ['dx.bifa 序列表', (c) => c.dx.bifa.map((h) => h['序'])],
  ['dx.bifa 全量', (c) => c.dx.bifa]
];""",
     """  ['dx.shensha.list', (c) => c.dx.shensha.list]
];"""),
    ("""      ['dx.xunkong', (c) => c.dx.xunkong],
      ['dx.bifa 序列表', (c) => c.dx.bifa.map((h) => h['序'])]
    ];""",
     """      ['dx.xunkong', (c) => c.dx.xunkong]
    ];"""),
]
for old, new in pairs:
    if old in t:
        t = t.replace(old, new)
        print("OK")
    else:
        print("MISS:", old[:60])
io.open(p, "w", encoding="utf-8").write(t)
print("done")
