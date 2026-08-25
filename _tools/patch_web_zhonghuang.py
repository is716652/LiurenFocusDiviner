# -*- coding: utf-8 -*-
"""Web 端中黄研习：盘面遁干三层切换 + 中黄块显示
1) drawDisk 遁干按模式取（zhMode 全局：旬/日遁/时遁）
2) 排盘后算 zhonghuangDun 存全局，渲染中黄块
3) 中黄块：时干/变干/六亲断语 + 模式切换
"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 遁干绘制：drawDisk 里中圈遁干用 dun[z] → 按 zhMode 取
    old_dun = """    /* 中圈：遁干（地盘干） */
    const [gx,gy]=xy(144,zAng(i));
    el("text",{x:gx,y:gy,"text-anchor":"middle","dominant-baseline":"central",fill:t2,"font-size":10},g).textContent=dun[z];"""
    assert s.count(old_dun) == 2, 'dun draw: %d (期望 drawDisk+drawDiskAnimated 两处)' % s.count(old_dun)
    new_dun = """    /* 中圈：遁干（地盘干；zhMode: 旬/日遁/时遁） */
    const [gx,gy]=xy(144,zAng(i));
    let dunShow=dun[z];
    if(zhMode==="日遁"&&chartC) dunShow=(chartC.zh_riDun||{})[z]||dun[z];
    if(zhMode==="时遁"&&chartC) dunShow=(chartC.zh_shiDun||{})[z]||dun[z];
    el("text",{x:gx,y:gy,"text-anchor":"middle","dominant-baseline":"central",fill:zhMode==="旬"?t2:"#C4A25C","font-size":10},g).textContent=dunShow;"""
    s = s.replace(old_dun, new_dun)

    # ② 全局 zhMode + 排盘钩子：doChart 里算中黄
    old_dochart = """function doChart(){
  chartBuilt=true;
  const c=buildChart();
  if(!c)return;
  chartC=c; // 供抓用神模块使用"""
    assert s.count(old_dochart) == 1, 'dochart: %d' % s.count(old_dochart)
    new_dochart = """let zhMode="旬"; // 遁干模式：旬/日遁/时遁
function doChart(){
  chartBuilt=true;
  const c=buildChart();
  if(!c)return;
  chartC=c; // 供抓用神模块使用
  const zh=LiurenCore.zhonghuangDun(c,selHour);
  chartC.zh_riDun=zh.riDun; chartC.zh_shiDun=zh.shiDun;
  chartC.zh_shiGan=zh.shiGan; chartC.zh_bianGan=zh.bianGan; chartC.zh_hourZhi=zh.hourZhi;
  renderZhonghuang();"""
    s = s.replace(old_dochart, new_dochart)

    # ③ 中黄块渲染函数 + 模式切换（加在 renderNianming 前）
    old_anchor = "/* 年命适配：选年命地支 → 上神/六亲/空亡/旺衰 + 建议；行年小运：出生年+性别 */"
    assert s.count(old_anchor) == 1, 'anchor: %d' % s.count(old_anchor)
    zh_fn = """/* ===== 中黄五变经：变干断课 + 遁干三层 ===== */
function renderZhonghuang(){
  const box=document.getElementById("lsZhonghuang");
  if(!box)return;
  if(!chartC||!chartC.zh_shiGan)return;
  const z=chartC;
  const bwz=LiurenCore.WXG[z.zh_bianGan], dwz=LiurenCore.WXG[z.r.dg];
  let lq="";
  if(bwz===dwz)lq="比肩";
  else if(LiurenCore.KE[dwz]===bwz)lq="妻财";
  else if(LiurenCore.KE[bwz]===dwz)lq="官鬼";
  else if(LiurenCore.SHENG(dwz)===bwz)lq="子孙";
  else lq="父母";
  let txt="变干"+z.zh_bianGan+"为日干"+z.r.dg+"之"+lq;
  if(lq==="官鬼")txt+="（鬼贼，防官非疾病，宜寻子孙制化）";
  else if(lq==="妻财")txt+="（财，求财有机会，宜主动）";
  else if(lq==="父母")txt+="（父，得文书长辈之助）";
  else if(lq==="子孙")txt+="（子，逢凶有解）";
  else txt+="（比肩，同辈合作，防争夺）";
  box.style.display="block";
  box.innerHTML=
    `<div class="t">中黄五变经 <span class="info">日干遁·时干遁 双演</span></div>`+
    `<div style="margin:6px 0;font-size:12px;">`+
      ["旬","日遁","时遁"].map(m=>`<span class="ls-chip${zhMode===m?" on":""}" onclick="setZhMode('${m}')" style="display:inline-block;padding:3px 12px;border-radius:12px;margin-right:6px;font-size:12px;${zhMode===m?"background:var(--brand_gold);color:#1A1410;":"background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);"}">${m}</span>`).join("")+
    `</div>`+
    (zhMode==="时遁"?`<div style="font-size:13px;color:var(--brand_gold);font-weight:600;">时干${z.zh_shiGan} · 变干${z.zh_bianGan}（${z.zh_hourZhi}宫）· 日干${z.r.dg}为体</div>`:"")+
    (zhMode==="日遁"?`<div style="font-size:12px;color:var(--text_secondary);">日干遁盘（体）：${z.r.dg}日 · 十二宫日遁干</div>`:"")+
    `<div style="font-size:12px;color:var(--text_secondary);line-height:1.8;">${txt}</div>`+
    `<div style="font-size:11px;color:var(--text_tertiary);margin-top:4px;">注：中黄以日干及时干各起五鼠遁排天干，与传统旬遁不同（古籍研习参考）</div>`;
  drawDisk(chartC); // 遁干层重绘
}
function setZhMode(m){ zhMode=m; renderZhonghuang(); }
""" + old_anchor
    s = s.replace(old_anchor, zh_fn)

    # ④ HTML：加 lsZhonghuang 容器（在 lsNianming 后）
    old_html = """          <div class="ls-nianming" id="lsNianming" style="margin-top:8px;"></div>"""
    assert s.count(old_html) == 1, 'html: %d' % s.count(old_html)
    new_html = """          <div class="ls-nianming" id="lsNianming" style="margin-top:8px;"></div>
          <div class="ls-zhonghuang" id="lsZhonghuang" style="display:none;margin-top:8px;"></div>"""
    s = s.replace(old_html, new_html)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('WEB ZHONGHUANG PATCH OK')

if __name__ == '__main__':
    main()
