# -*- coding: utf-8 -*-
"""PanDisk.ets 内外圈重排：天将(最外)→天盘(外)→遁干(中)→地盘(内)→中心"""
import io

p = r"D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\APP\LiurenFocusDiviner\entry\src\main\ets\components\PanDisk.ets"
t = io.open(p, encoding="utf-8").read()

old = """    /* 十二宫位：天将(外) / 地盘(中) / 遁干(次内) / 天盘(内)
       方位约定：午(正南)在上、子(正北)在下、卯(东)在左、酉(西)在右
       角度：午(index6)=-90°(上)，顺行 → 未→申→酉(0°)→…→子(90°下) */
    for (let i = 0; i < 12; i++) {
      const ang = -Math.PI / 2 + (i - 6) * Math.PI / 6;
      const gongZhi = this.zhi[i];
      const tianPan = c.tp[gongZhi];
      const dunGan = c.dun[gongZhi];
      const jiang = c.jiangMap[gongZhi];
      const isKong = kongList.indexOf(tianPan) >= 0;

      /* 天将（最外圈，2字） */
      const rJ = w * 0.412;
      const jx = cx + rJ * Math.cos(ang);
      const jy = cy + rJ * Math.sin(ang);
      ctx.fillStyle = (LiurenCore.JIANG_JX[jiang] === '吉') ? '#C4A25C' : cinnabar;
      ctx.font = fontPx(w * 0.048);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(jiang, jx, jy);

      /* 地盘十二支（固定，1字） */
      const rD = w * 0.335;
      const dx = cx + rD * Math.cos(ang);
      const dy = cy + rD * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(dx, dy, w * 0.032, 0, Math.PI * 2);
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(233,200,120,0.20)' : 'rgba(233,200,120,0.10)';
      ctx.fill();
      ctx.fillStyle = (i % 2 === 0) ? gold : dim;
      ctx.font = fontPx(w * 0.06);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gongZhi, dx, dy);

      /* 遁干（地盘干，次内圈，1字） */
      const rG = w * 0.255;
      const gx = cx + rG * Math.cos(ang);
      const gy = cy + rG * Math.sin(ang);
      ctx.fillStyle = faint;
      ctx.font = fontPx(w * 0.044);
      ctx.fillText(dunGan, gx, gy);

      /* 天盘支（内圈，1字，旬空降暗） */
      const rT = w * 0.165;
      const tx = cx + rT * Math.cos(ang);
      const ty = cy + rT * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(tx, ty, w * 0.026, 0, Math.PI * 2);
      ctx.fillStyle = isKong ? 'rgba(120,110,90,0.25)' : 'rgba(240,217,140,0.16)';
      ctx.fill();
      ctx.fillStyle = isKong ? '#7A6E55' : goldBright;
      ctx.font = fontPx(w * 0.068);
      ctx.fillText(tianPan, tx, ty);
    }"""

new = """    /* 十二宫位（传统盘面，由外到内）：
       天将(最外·接天盘外) → 天盘支(外圈) → 遁干(中圈) → 地盘支(内圈) → 中心月将
       方位约定：午(正南)在上、子(正北)在下、卯(东)在左、酉(西)在右
       角度：午(index6)=-90°(上)，顺行 → 未→申→酉(0°)→…→子(90°下) */
    for (let i = 0; i < 12; i++) {
      const ang = -Math.PI / 2 + (i - 6) * Math.PI / 6;
      const gongZhi = this.zhi[i];
      const tianPan = c.tp[gongZhi];
      const dunGan = c.dun[gongZhi];
      const jiang = c.jiangMap[gongZhi];
      const isKong = kongList.indexOf(tianPan) >= 0;

      /* 天将（最外圈，2字，接天盘外） */
      const rJ = w * 0.412;
      const jx = cx + rJ * Math.cos(ang);
      const jy = cy + rJ * Math.sin(ang);
      ctx.fillStyle = (LiurenCore.JIANG_JX[jiang] === '吉') ? '#C4A25C' : cinnabar;
      ctx.font = fontPx(w * 0.048);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(jiang, jx, jy);

      /* 天盘支（外圈，1字，旬空降暗；月将加时后天盘加临于地盘宫位） */
      const rT = w * 0.335;
      const tx = cx + rT * Math.cos(ang);
      const ty = cy + rT * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(tx, ty, w * 0.032, 0, Math.PI * 2);
      ctx.fillStyle = isKong ? 'rgba(120,110,90,0.25)' : 'rgba(240,217,140,0.16)';
      ctx.fill();
      ctx.fillStyle = isKong ? '#7A6E55' : goldBright;
      ctx.font = fontPx(w * 0.06);
      ctx.fillText(tianPan, tx, ty);

      /* 遁干（中圈，地盘干，1字） */
      const rG = w * 0.255;
      const gx = cx + rG * Math.cos(ang);
      const gy = cy + rG * Math.sin(ang);
      ctx.fillStyle = faint;
      ctx.font = fontPx(w * 0.044);
      ctx.fillText(dunGan, gx, gy);

      /* 地盘十二支（内圈，固定，1字） */
      const rD = w * 0.165;
      const dx = cx + rD * Math.cos(ang);
      const dy = cy + rD * Math.sin(ang);
      ctx.beginPath();
      ctx.arc(dx, dy, w * 0.026, 0, Math.PI * 2);
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(233,200,120,0.20)' : 'rgba(233,200,120,0.10)';
      ctx.fill();
      ctx.fillStyle = (i % 2 === 0) ? gold : dim;
      ctx.font = fontPx(w * 0.068);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gongZhi, dx, dy);
    }"""

if old in t:
    t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("OK PanDisk layout")
else:
    print("MISS")
