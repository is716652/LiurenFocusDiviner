# -*- coding: utf-8 -*-
"""Web 端外应取用：SVG 天地盘点击选支（天盘支优先 + 地盘支）
drawDisk 与 drawDiskAnimated 两处相同结构都加（动画版最终被静态重绘覆盖）"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html'

def main():
    s = io.open(P, 'r', encoding='utf-8').read()

    # ① 天盘支圆/文字加点击（两处，r=16 天盘支圈；用不含注释的公共子串）
    old_t = """    const [tx,ty]=xy(230,zAng(i));
    el("circle",{cx:tx,cy:ty,r:16,fill:"rgba(0,0,0,.10)",stroke:tl,"stroke-width":1},g);
    el("text",{x:tx,y:ty,"text-anchor":"middle","dominant-baseline":"central",fill:gold,"font-size":18,"font-weight":"700"},g).textContent=tz;"""
    new_t = """    const [tx,ty]=xy(230,zAng(i));
    const tc=el("circle",{cx:tx,cy:ty,r:16,fill:"rgba(0,0,0,.10)",stroke:tl,"stroke-width":1},g);
    tc.style.cursor="pointer"; tc.onclick=(e)=>{e.stopPropagation();pickCustomZhi(tz,"天盘");};
    const tt=el("text",{x:tx,y:ty,"text-anchor":"middle","dominant-baseline":"central",fill:gold,"font-size":18,"font-weight":"700"},g);
    tt.textContent=tz; tt.style.cursor="pointer"; tt.onclick=(e)=>{e.stopPropagation();pickCustomZhi(tz,"天盘");};"""
    n_t = s.count(old_t)
    assert n_t == 2, 'tian expect 2 got %d' % n_t
    s = s.replace(old_t, new_t)

    # ② 地盘支圆/文字加点击（两处，r=12 地盘支圈）
    old_d = """    const [ex,ey]=xy(108,zAng(i));
    el("circle",{cx:ex,cy:ey,r:12,fill:"rgba(0,0,0,.06)",stroke:line,"stroke-width":1},g);
    el("text",{x:ex,y:ey,"text-anchor":"middle","dominant-baseline":"central",fill:text,"font-size":17,"font-weight":"600"},g).textContent=z;"""
    new_d = """    const [ex,ey]=xy(108,zAng(i));
    const ec=el("circle",{cx:ex,cy:ey,r:12,fill:"rgba(0,0,0,.06)",stroke:line,"stroke-width":1},g);
    ec.style.cursor="pointer"; ec.onclick=(e)=>{e.stopPropagation();pickCustomZhi(z,"地盘");};
    const et=el("text",{x:ex,y:ey,"text-anchor":"middle","dominant-baseline":"central",fill:text,"font-size":17,"font-weight":"600"},g);
    et.textContent=z; et.style.cursor="pointer"; et.onclick=(e)=>{e.stopPropagation();pickCustomZhi(z,"地盘");};"""
    n_d = s.count(old_d)
    assert n_d == 2, 'di expect 2 got %d' % n_d
    s = s.replace(old_d, new_d)

    # ③ pickCustomZhi 函数（加在 switchYongshen 前）
    old_fn = "/* 切换用神：清理旧高亮 → 重新生成动态三传与高亮 */"
    new_fn = """/* 外应取用：点击盘面任一支 → 自定义为用神（不受占事候选限制；天盘支优先）
   动态三传/毕法/年命行年自动联动（均以 curYongshen 为初传） */
let customYongShen=false;
function pickCustomZhi(z, layer){
  if(!chartC)return;
  curYongshen=z;
  customYongShen=true;
  clearLeishenHighlight();
  runLeishen();
  renderNianming();
}
/* 切换用神：清理旧高亮 → 重新生成动态三传与高亮 */"""
    assert s.count(old_fn) == 1, 'fn: %d' % s.count(old_fn)
    s = s.replace(old_fn, new_fn)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('WEB PICK PATCH OK (tian=%d di=%d)' % (n_t, n_d))

if __name__ == '__main__':
    main()
