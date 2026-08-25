# -*- coding: utf-8 -*-
"""Web 端：盘面遁干改天盘支干 + 辅助层（地盘干/本位神）开关"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① drawDisk 遁干：dun[z]（地盘宫）→ dun[tp[z]]（天盘支）；两处（drawDisk + drawDiskAnimated）
    old_dun = """    const [gx,gy]=xy(144,zAng(i));
    let dunShow=dun[z];
    if(zhMode==="日遁"&&chartC) dunShow=(chartC.zh_riDun||{})[z]||dun[z];
    if(zhMode==="时遁"&&chartC) dunShow=(chartC.zh_shiDun||{})[z]||dun[z];
    el("text",{x:gx,y:gy,"text-anchor":"middle","dominant-baseline":"central",fill:zhMode==="旬"?t2:"#C4A25C","font-size":10},g).textContent=dunShow;"""
    assert s.count(old_dun) == 2, 'dun: %d' % s.count(old_dun)
    new_dun = """    const [gx,gy]=xy(144,zAng(i));
    const tpz=tp[z]; // 天盘支
    let dunShow=dun[tpz];
    if(zhMode==="日遁"&&chartC) dunShow=(chartC.zh_riDun||{})[tpz]||dun[tpz];
    if(zhMode==="时遁"&&chartC) dunShow=(chartC.zh_shiDun||{})[tpz]||dun[tpz];
    el("text",{x:gx,y:gy,"text-anchor":"middle","dominant-baseline":"central",fill:zhMode==="旬"?t2:"#C4A25C","font-size":10},g).textContent=dunShow;
    // 辅助层：地盘干（铜绿小字）
    if(showDunDi) el("text",{x:gx,y:gy+16,"text-anchor":"middle","dominant-baseline":"central",fill:"#7FA69A","font-size":7},g).textContent=dun[z];
    // 辅助层：本位神（暗金极小字）
    if(showBenshen){
      const [bx,by]=xy(78,zAng(i));
      el("text",{x:bx,y:by,"text-anchor":"middle","dominant-baseline":"central",fill:"#8A7448","font-size":7},g).textContent=LiurenCore.BENSHEN[z]||"";
    }"""
    s = s.replace(old_dun, new_dun)

    # ② 全局开关 + 天盘标题切换按钮
    old_zh = """let zhMode="旬"; // 遁干模式：旬/日遁/时遁"""
    assert s.count(old_zh) == 1, 'zh: %d' % s.count(old_zh)
    new_zh = """let zhMode="旬"; // 遁干模式：旬/日遁/时遁
let showDunDi=false, showBenshen=false; // 辅助层开关"""
    s = s.replace(old_zh, new_zh)

    # ③ 天盘 h3 标题加辅助层开关
    old_h3 = """        <h3 style="display:flex;align-items:center;gap:8px;">天地盘
          <span style="display:inline-flex;gap:4px;margin-left:auto;font-weight:400;">
            <span class="ls-chip zh-switch${zhMode==='旬'?' on':''}" onclick="setZhMode('旬')" style="display:inline-block;padding:2px 10px;border-radius:8px;font-size:11px;cursor:pointer;${zhMode==='旬'?'background:var(--brand_gold);color:#1A1410;':'background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);'}">旬</span>
            <span class="ls-chip zh-switch${zhMode==='日遁'?' on':''}" onclick="setZhMode('日遁')" style="display:inline-block;padding:2px 10px;border-radius:8px;font-size:11px;cursor:pointer;${zhMode==='日遁'?'background:var(--brand_gold);color:#1A1410;':'background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);'}">日遁</span>
            <span class="ls-chip zh-switch${zhMode==='时遁'?' on':''}" onclick="setZhMode('时遁')" style="display:inline-block;padding:2px 10px;border-radius:8px;font-size:11px;cursor:pointer;${zhMode==='时遁'?'background:var(--brand_gold);color:#1A1410;':'background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);'}">时遁</span>
          </span>
        </h3>"""
    assert s.count(old_h3) == 1, 'h3: %d' % s.count(old_h3)
    new_h3 = """        <h3 style="display:flex;align-items:center;gap:8px;">天地盘
          <span style="display:inline-flex;gap:4px;margin-left:auto;font-weight:400;">
            <span class="ls-chip zh-switch${zhMode==='旬'?' on':''}" onclick="setZhMode('旬')" style="display:inline-block;padding:2px 10px;border-radius:8px;font-size:11px;cursor:pointer;${zhMode==='旬'?'background:var(--brand_gold);color:#1A1410;':'background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);'}">旬</span>
            <span class="ls-chip zh-switch${zhMode==='日遁'?' on':''}" onclick="setZhMode('日遁')" style="display:inline-block;padding:2px 10px;border-radius:8px;font-size:11px;cursor:pointer;${zhMode==='日遁'?'background:var(--brand_gold);color:#1A1410;':'background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);'}">日遁</span>
            <span class="ls-chip zh-switch${zhMode==='时遁'?' on':''}" onclick="setZhMode('时遁')" style="display:inline-block;padding:2px 10px;border-radius:8px;font-size:11px;cursor:pointer;${zhMode==='时遁'?'background:var(--brand_gold);color:#1A1410;':'background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);'}">时遁</span>
            <span onclick="showDunDi=!showDunDi;drawDisk(chartC)" style="display:inline-block;padding:2px 10px;border-radius:8px;font-size:11px;cursor:pointer;${showDunDi?'background:#7FA69A;color:#1A1410;':'background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);'}">地盘干</span>
            <span onclick="showBenshen=!showBenshen;drawDisk(chartC)" style="display:inline-block;padding:2px 10px;border-radius:8px;font-size:11px;cursor:pointer;${showBenshen?'background:#8A7448;color:#F0E6C8;':'background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);'}">本位</span>
          </span>
        </h3>"""
    s = s.replace(old_h3, new_h3)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('WEB LAYER PATCH OK')

if __name__ == '__main__':
    main()
