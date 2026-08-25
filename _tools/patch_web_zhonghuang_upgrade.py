# -*- coding: utf-8 -*-
"""Web 端中黄块升级：双视角对比 + 变干主线 + 建合检测"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① doChart 里算 analyze 并存储
    old_dc = """  const zh=LiurenCore.zhonghuangDun(c,selHour);
  chartC.zh_riDun=zh.riDun; chartC.zh_shiDun=zh.shiDun;
  chartC.zh_shiGan=zh.shiGan; chartC.zh_bianGan=zh.bianGan; chartC.zh_hourZhi=zh.hourZhi;
  renderZhonghuang();"""
    assert s.count(old_dc) == 1, 'dc: %d' % s.count(old_dc)
    new_dc = """  const zh=LiurenCore.zhonghuangDun(c,selHour);
  chartC.zh_riDun=zh.riDun; chartC.zh_shiDun=zh.shiDun;
  chartC.zh_shiGan=zh.shiGan; chartC.zh_bianGan=zh.bianGan; chartC.zh_hourZhi=zh.hourZhi;
  chartC.zh_ana=LiurenCore.zhonghuangAnalyze(c,selHour);
  renderZhonghuang();"""
    s = s.replace(old_dc, new_dc)

    # ② renderZhonghuang 替换为三块展示
    old_fn_start = "function renderZhonghuang(){"
    assert s.count(old_fn_start) == 1, 'fn: %d' % s.count(old_fn_start)
    i0 = s.index(old_fn_start)
    i1 = s.index("function setZhMode", i0)
    new_fn = """function renderZhonghuang(){
  const box=document.getElementById("lsZhonghuang");
  if(!box)return;
  if(!chartC||!chartC.zh_ana)return;
  const a=chartC.zh_ana, z=chartC;
  const lq=a.bianLq;
  let txt="变干"+a.dun.bianGan+"为日干"+a.dun.dayGan+"之"+lq;
  if(lq==="官鬼")txt+="（鬼贼，防官非疾病，宜寻子孙制化）";
  else if(lq==="妻财")txt+="（财，求财有机会，宜主动）";
  else if(lq==="父母")txt+="（父，得文书长辈之助）";
  else if(lq==="子孙")txt+="（子，逢凶有解）";
  else txt+="（比肩，同辈合作，防争夺）";
  if(a.bianInChuan)txt+=" 变干入"+a.bianInChuan+"，事应之速。"; else txt+=" 变干不入三传，事缓。";
  if(a.changed.length)txt+=" 六亲视角变化"+a.changed.length+"宫（"+a.changed.join("")+"），中黄断课与此异。";
  const cmpHtml=a.cmp.map(it=>
    `<span style="display:inline-block;font-size:10px;padding:3px 7px;border-radius:8px;margin:0 5px 5px 0;${it.changed?"background:rgba(240,217,140,.12);color:var(--brand_gold);":"background:rgba(107,95,69,.12);color:var(--text_secondary);"}">${it.gong} ${it.xunLq}${it.changed?"→"+it.zhLq:""}</span>`).join("");
  const jhHtml=a.jianhe.length?a.jianhe.map(j=>
    `<div style="font-size:11px;color:var(--brand_gold);line-height:1.7;">${j.pos}(${j.gong}宫) 日遁${j.riGan}×时遁${j.shiGan} → ${j.type}（吉，夫妇相见鬼不能克）</div>`).join(""):
    `<div style="font-size:11px;color:var(--text_secondary);">本盘无建合（日遁与时遁在日上/支上/变干宫/三传无干合）</div>`;
  box.style.display="block";
  box.innerHTML=
    `<div class="t">中黄五变经 <span class="info">日干遁·时干遁 双演 · 遁干切换在天地盘标题</span></div>`+
    `<div style="font-size:11px;color:var(--text_secondary);margin:4px 0;">① 六亲视角对比（旬遁 → 中黄）· 变化 <b style="color:var(--brand_gold)">${a.changed.length}</b> 宫</div>`+
    `<div style="margin-bottom:4px;">${cmpHtml}</div>`+
    `<div style="font-size:12px;color:var(--brand_gold);font-weight:600;margin:4px 0;">② 变干主线：变干${a.dun.bianGan}(${a.bianGong}宫)${a.bianJiang?" 乘"+a.bianJiang:""} 为日干${a.dun.dayGan}之${a.bianLq}${a.bianInChuan?" · 入"+a.bianInChuan:" · 不入三传"}</div>`+
    `<div style="font-size:12px;color:var(--text_secondary);line-height:1.8;">${txt}</div>`+
    `<div style="font-size:11px;color:var(--text_secondary);margin-top:4px;">③ 建合检测（日遁×时遁 天干五合）</div>`+
    jhHtml+
    `<div style="font-size:11px;color:var(--text_tertiary);margin-top:4px;">注：中黄以日干及时干各起五鼠遁排天干，与传统旬遁不同（古籍研习参考）</div>`;
  drawDisk(chartC); // 遁干层重绘
}
"""
    s = s[:i0] + new_fn + s[i1:]

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('WEB ZHONGHUANG UPGRADE OK')

if __name__ == '__main__':
    main()
