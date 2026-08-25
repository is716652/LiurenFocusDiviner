# -*- coding: utf-8 -*-
"""Splash.ets：density 字号 + 午上子下 + 四正方位 + 中心炁加大"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\pages\Splash.ets"
t = io.open(p, encoding="utf-8").read()

old = """    // 地盘十二支（固定）
    for (let i = 0; i < 12; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / 6;
      const r = w * 0.185;
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(233,200,120,0.20)' : 'rgba(233,200,120,0.10)';
      ctx.fill();
      ctx.fillStyle = (i % 2 === 0) ? gold : dim;
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.zhi[i], x, y);
    }

    // 天盘十二支（旋转）
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((this.angle * Math.PI) / 180);
    for (let i = 0; i < 12; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / 6;
      const r = w * 0.115;
      const x = r * Math.cos(ang);
      const y = r * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240,217,140,0.16)';
      ctx.fill();
      ctx.fillStyle = '#F0D98C';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.zhi[i], x, y);
    }
    ctx.restore();

    // 中心炁点（光晕）
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.075, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(233,200,120,0.18)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.045, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(233,200,120,0.55)';
    ctx.fill();
    ctx.fillStyle = '#FDF3D0';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('炁', cx, cy);
  }
}"""

new = """    /* 四正方位（外圈标注：午南在上 / 子北在下 / 卯东在左 / 酉西在右） */
    ctx.font = fontPx(13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fwName: string[] = ['', '北', '', '东', '', '', '南', '', '', '西', '', ''];
    for (let i = 0; i < 12; i++) {
      const nm = fwName[i];
      if (nm === '') {
        continue;
      }
      const a = -Math.PI / 2 + (i - 6) * Math.PI / 6;
      const r = w * 0.46;
      ctx.fillStyle = 'rgba(196,162,92,0.85)';
      ctx.fillText(nm, cx + r * Math.cos(a), cy + r * Math.sin(a));
    }

    // 地盘十二支（固定；午上子下：午在正上 -90°，顺行）
    for (let i = 0; i < 12; i++) {
      const ang = -Math.PI / 2 + (i - 6) * Math.PI / 6;
      const r = w * 0.185;
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(233,200,120,0.20)' : 'rgba(233,200,120,0.10)';
      ctx.fill();
      ctx.fillStyle = (i % 2 === 0) ? gold : dim;
      ctx.font = fontPx(19);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.zhi[i], x, y);
    }

    // 天盘十二支（旋转；同方位约定，随天盘整体旋转）
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((this.angle * Math.PI) / 180);
    for (let i = 0; i < 12; i++) {
      const ang = -Math.PI / 2 + (i - 6) * Math.PI / 6;
      const r = w * 0.115;
      const x = r * Math.cos(ang);
      const y = r * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240,217,140,0.16)';
      ctx.fill();
      ctx.fillStyle = '#F0D98C';
      ctx.font = fontPx(15);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.zhi[i], x, y);
    }
    ctx.restore();

    // 中心炁点（光晕）
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.085, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(233,200,120,0.18)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.052, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(233,200,120,0.55)';
    ctx.fill();
    ctx.fillStyle = '#FDF3D0';
    ctx.font = boldPx(24);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('炁', cx, cy);
  }
}"""

if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK Splash disk")
else:
    print("MISS Splash disk")
    # 打印匹配位置
    import re
    m = re.search(r"// 地盘十二支", t)
    print("marker found:", m is not None)
