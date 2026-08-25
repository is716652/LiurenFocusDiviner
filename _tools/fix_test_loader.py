# -*- coding: utf-8 -*-
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\_test_selectDuyu.js"
t = io.open(p, encoding="utf-8").read()

old = """// 加载核心（全局脚本：执行后 LiurenCore/YongShenCore 挂 globalThis）
require('./core/liuren-core.js');"""
new = """// 加载核心（全局脚本：用 vm.runInThisContext 以顶层作用域执行，class 挂 globalThis）
const vm = require('vm');
const coreSrc = fs.readFileSync('./core/liuren-core.js', 'utf-8');
vm.runInThisContext(coreSrc, { filename: 'liuren-core.js' });"""

if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK")
else:
    print("MISS")
