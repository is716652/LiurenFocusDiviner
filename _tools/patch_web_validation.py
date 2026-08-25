# -*- coding: utf-8 -*-
"""Web 端古籍案例速排 加三层校验（干支阴阳 + 月将×月支）+ 月支选择"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① HTML：加月支下拉（在年支后）
    old_html = """            <select id="ancYZ" style="background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);border-radius:8px;padding:4px 6px;font-family:inherit;"><option value="">年支</option>${["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].map(z=>`<option>${z}</option>`).join("")}</select>"""
    assert s.count(old_html) == 1, 'html: %d' % s.count(old_html)
    new_html = old_html + """
            <select id="ancMZ" style="background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);border-radius:8px;padding:4px 6px;font-family:inherit;"><option value="">月支</option>${["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].map(z=>`<option>${z}</option>`).join("")}</select>"""
    s = s.replace(old_html, new_html)

    # ② doAncientChart 加校验
    old_fn = """function doAncientChart(){
  const mj=document.getElementById("ancMj").value.replace("将","");
  const dg=document.getElementById("ancDg").value;
  const dz=document.getElementById("ancDz").value;
  const hz=document.getElementById("ancHz").value.replace("时","");
  const yg=document.getElementById("ancYG").value||"";
  const yz=document.getElementById("ancYZ").value||"";
  const c=LiurenCore.buildChartAncient(mj,dg,dz,hz,yg,yz,"");
  if(!c){alert("起盘失败");return;}"""
    assert s.count(old_fn) == 1, 'fn: %d' % s.count(old_fn)
    new_fn = """function doAncientChart(){
  const mj=document.getElementById("ancMj").value.replace("将","");
  const dg=document.getElementById("ancDg").value;
  const dz=document.getElementById("ancDz").value;
  const hz=document.getElementById("ancHz").value.replace("时","");
  const yg=document.getElementById("ancYG").value||"";
  const yz=document.getElementById("ancYZ").value||"";
  const mz=document.getElementById("ancMZ").value||"";
  // ① 日干支阴阳匹配
  if(!LiurenCore.validGanZhi(dg,dz)){alert("日干支不合："+dg+dz+"（阳干配阳支/阴干配阴支，60甲子中不存在）");return;}
  // ② 年干支阴阳匹配
  if(yg&&yz&&!LiurenCore.validGanZhi(yg,yz)){alert("年干支不合："+yg+yz+"（阴阳不配，不存在）");return;}
  // ③ 月将×月支匹配
  if(mz){
    const exp=LiurenCore.yuejiangForMonth(mz);
    if(exp!==mj){alert(mz+"月（"+mz+"支）月将应为"+exp+"将，非"+mj+"将");return;}
  }
  const c=LiurenCore.buildChartAncient(mj,dg,dz,hz,yg,yz,mz);
  if(!c){alert("起盘失败");return;}"""
    s = s.replace(old_fn, new_fn)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('WEB VALIDATION PATCH OK')

if __name__ == '__main__':
    main()
