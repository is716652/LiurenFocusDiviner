# -*- coding: utf-8 -*-
"""Web 端古籍案例速排：输入月将/日干/日支/占时 → 完整盘面渲染"""
import io

P = r'D:\nutstore\HarmonyOS\GuoXue_Research\LargeLiuRen-Design\UI\大六壬万年历起课.html'

def main():
    s = io.open(P, encoding='utf-8').read()

    # ① HTML：排盘按钮后加案例速排区
    old_html = """        <div style="margin-top:var(--space_large);text-align:center;">
          <button id="btnChart" style="width:100%;padding:12px 0;border:none;border-radius:var(--radius_large);background:linear-gradient(135deg,var(--brand_gold),var(--brand_cinnabar));color:#fff;font-size:var(--fs_body_l);font-weight:600;letter-spacing:6px;cursor:pointer;box-shadow:var(--shadow_medium);transition:transform .15s;font-family:inherit;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='none'" onclick="doChart()">排 盘</button>
        </div>"""
    assert s.count(old_html) == 1, 'html: %d' % s.count(old_html)
    new_html = old_html + """
        <div style="margin-top:var(--space_large);">
          <div style="font-size:var(--fs_caption_l);color:var(--text_secondary);margin-bottom:6px;">📜 古籍案例速排 <span style="font-size:11px;color:var(--text_tertiary);">月将+日干支+占时 → 完整盘面（年干支可选）</span></div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:12px;">
            <select id="ancMj" style="background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);border-radius:8px;padding:4px 6px;font-family:inherit;">${["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].map(z=>`<option${z==="未"?" selected":""}>${z}将</option>`).join("")}</select>
            <select id="ancDg" style="background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);border-radius:8px;padding:4px 6px;font-family:inherit;">${["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"].map(g=>`<option${g==="甲"?" selected":""}>${g}</option>`).join("")}</select>
            <select id="ancDz" style="background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);border-radius:8px;padding:4px 6px;font-family:inherit;">${["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].map(z=>`<option${z==="戌"?" selected":""}>${z}</option>`).join("")}</select>
            <select id="ancHz" style="background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);border-radius:8px;padding:4px 6px;font-family:inherit;">${["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].map(z=>`<option${z==="卯"?" selected":""}>${z}时</option>`).join("")}</select>
            <select id="ancYG" style="background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);border-radius:8px;padding:4px 6px;font-family:inherit;"><option value="">年干</option>${["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"].map(g=>`<option>${g}</option>`).join("")}</select>
            <select id="ancYZ" style="background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);border-radius:8px;padding:4px 6px;font-family:inherit;"><option value="">年支</option>${["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].map(z=>`<option>${z}</option>`).join("")}</select>
            <button onclick="doAncientChart()" style="background:var(--brand_gold);color:#1A1410;border:none;border-radius:8px;padding:4px 14px;cursor:pointer;font-size:12px;font-family:inherit;">反推盘面</button>
          </div>
        </div>"""
    s = s.replace(old_html, new_html)

    # ② doAncientChart 函数（加在 doChart 前）
    old_fn = "function doChart(){"
    assert s.count(old_fn) == 1, 'fn: %d' % s.count(old_fn)
    new_fn = """function doAncientChart(){
  const mj=document.getElementById("ancMj").value.replace("将","");
  const dg=document.getElementById("ancDg").value;
  const dz=document.getElementById("ancDz").value;
  const hz=document.getElementById("ancHz").value.replace("时","");
  const yg=document.getElementById("ancYG").value||"";
  const yz=document.getElementById("ancYZ").value||"";
  const c=LiurenCore.buildChartAncient(mj,dg,dz,hz,yg,yz,"");
  if(!c){alert("起盘失败");return;}
  chartC=c;
  selDate=dg+dz+"日(古籍)"; selHour=hz;
  renderSizhu(c);
  drawDisk(c);
  renderKeg(c);
  renderChuan(c);
  document.getElementById("calInfo").textContent="古籍案例："+mj+"将 "+dg+dz+"日 "+hz+"时 · 旬空"+(c.dx.xunkong.length?c.dx.xunkong.join(""):"无");
  renderBifaSection();
  runLeishen();
}
function doChart(){"""
    s = s.replace(old_fn, new_fn, 1)

    io.open(P, 'w', encoding='utf-8', newline='').write(s)
    print('WEB ANCIENT PATCH OK')

if __name__ == '__main__':
    main()
