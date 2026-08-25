# -*- coding: utf-8 -*-
"""万年历数据工具 —— 共享路径。

所有 tools/ 下的脚本统一通过本模块定位项目根目录、依赖库与数据目录，
因此脚本可以放在 tools/ 子目录中任意运行（直接运行或互相导入均可）。
"""
import os

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TOOLS_DIR)          # LargeLiuRen-Design/
PYEXT = os.path.join(PROJECT_ROOT, ".pyext")        # 本地依赖库目录（lunar_python/cnlunar/skyfield 等）
BSP = os.path.join(PYEXT, "de422.bsp")              # JPL DE422 星历文件
DATA_DIR = os.path.join(PROJECT_ROOT, "万年历JSON数据")
JSON_DIR = os.path.join(DATA_DIR, "json")           # 原始逐日数据（只读）
EXT_DIR = os.path.join(DATA_DIR, "ext")             # 扩展数据输出目录
