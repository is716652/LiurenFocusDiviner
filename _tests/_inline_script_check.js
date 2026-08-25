
LiurenCore.init({duxiang: window.DUXIANG_RULES, shensha: window.SHENSHA_RULES, bifa: window.BIFA, xingnian: window.XN_SCORE});
YongShenCore.zhanShi = (window.ZHANSHI || {});
/* ============ 数据加载（按十年分片动态加载）============ */
/* 日历数据：UI/_data/cal_XXXXs.js → window.CAL[年]=[天,...] */
let loadedDecades = {};
function loadDecade(y){
  const dec = Math.floor(y/10);
  if(loadedDecades[dec]) return true;
  const s = document.createElement("script");
  s.src = `_data/cal_${dec}0s.js`;
  s.onload = ()=>{ loadedDecades[dec]=true; if(window._onDataLoaded) window._onDataLoaded(); };
  document.body.appendChild(s);
  return false;
}
function yearData(y){ return window.CAL && window.CAL[String(y)]; }
/* ============ 常量 ============ */
const GAN=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const ZHI=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const WEEK=["一","二","三","四","五","六","日"];
const LUNAR_MONTH=["正","二","三","四","五","六","七","八","九","十","冬","腊"];
const LUNAR_DAY=["初一","初二","初三","初四","初五","初六","初七","初八","初九","初十","十一","十二","十三","十四","十五","十六","十七","十八","十九","二十","廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十"];
const JI_GONG={甲:"寅",乙:"辰",丙:"巳",丁:"未",戊:"巳",己:"未",庚:"申",辛:"戌",壬:"亥",癸:"丑"};
const WX={子:"水",丑:"土",寅:"木",卯:"木",辰:"土",巳:"火",午:"火",未:"土",申:"金",酉:"金",戌:"土",亥:"水"};
const WXG={甲:"木",乙:"木",丙:"火",丁:"火",戊:"土",己:"土",庚:"金",辛:"金",壬:"水",癸:"水"};
const KE={"木":"土","土":"水","水":"火","火":"金","金":"木"};
const JIEQI={"小寒":1,"大寒":1,"立春":1,"雨水":1,"惊蛰":1,"春分":1,"清明":1,"谷雨":1,"立夏":1,"小满":1,"芒种":1,"夏至":1,"小暑":1,"大暑":1,"立秋":1,"处暑":1,"白露":1,"秋分":1,"寒露":1,"霜降":1,"立冬":1,"小雪":1,"大雪":1,"冬至":1};
const GUIREN={甲:["丑","未"],戊:["丑","未"],庚:["丑","未"],乙:["子","申"],己:["子","申"],丙:["亥","酉"],丁:["亥","酉"],壬:["巳","卯"],癸:["巳","卯"],辛:["午","寅"]};
const JIANG_SHUN=["贵人","螣蛇","朱雀","六合","勾陈","青龙","天空","白虎","太常","玄武","太阴","天后"];
const JIANG_NI=["贵人","天后","太阴","玄武","太常","白虎","天空","青龙","勾陈","六合","朱雀","螣蛇"];
/* 十二时辰表 */
const SHICHEN=[
  {name:"子",start:"23:00",end:"01:00",label:"夜半"},
  {name:"丑",start:"01:00",end:"03:00",label:"鸡鸣"},
  {name:"寅",start:"03:00",end:"05:00",label:"平旦"},
  {name:"卯",start:"05:00",end:"07:00",label:"日出"},
  {name:"辰",start:"07:00",end:"09:00",label:"食时"},
  {name:"巳",start:"09:00",end:"11:00",label:"隅中"},
  {name:"午",start:"11:00",end:"13:00",label:"日中"},
  {name:"未",start:"13:00",end:"15:00",label:"日昳"},
  {name:"申",start:"15:00",end:"17:00",label:"晡时"},
  {name:"酉",start:"17:00",end:"19:00",label:"日入"},
  {name:"戌",start:"19:00",end:"21:00",label:"黄昏"},
  {name:"亥",start:"21:00",end:"23:00",label:"人定"}
];
const BENSHEN={子:"天后",丑:"贵人",寅:"青龙",卯:"六合",辰:"勾陈",巳:"螣蛇",午:"朱雀",未:"太常",申:"白虎",酉:"太阴",戌:"天空",亥:"玄武"};
const JIANG_JX={贵人:"吉",天后:"吉",太阴:"吉",玄武:"凶",太常:"吉",白虎:"凶",天空:"凶",青龙:"吉",勾陈:"凶",六合:"吉",朱雀:"凶",螣蛇:"凶"};
const YANG_ZHI={子:1,寅:1,辰:1,午:1,申:1,戌:1};
const G_YANG={甲:1,丙:1,戊:1,庚:1,壬:1};

const MONTHS=[31,28,31,30,31,30,31,31,30,31,30,31];
function isLeap(y){return (y%4===0&&y%100!==0)||y%400===0;}
function pad(n){return n<10?"0"+n:""+n;}
function dayRec(ds){ // 按日期查日历记录（跨年度）
  if(!window.CAL) return null;
  const y=ds.slice(0,4), arr=window.CAL[y];
  if(!arr) return null;
  return arr.find(r=>r.d===ds)||null;
}

/* ============ 万年历 ============ */
let curY=2026, curM=1, selDate="2026-08-15", selHour="酉";
/* 默认当前日期（与鸿蒙端一致）：打开即定位今天并选中 */
(function initToday(){
  const t=new Date();
  curY=t.getFullYear(); curM=t.getMonth()+1;
  const p=(n)=>String(n).padStart(2,"0");
  selDate=`${curY}-${p(curM)}-${p(t.getDate())}`;
  const h=t.getHours();
  selHour=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"][Math.floor((h+1)/2)%12];
})();
let _pendingY=null;
function firstWeekday(y,m){const w=new Date(y,m-1,1).getDay();return (w+6)%7;}
function renderCal(){
  // 若当前年份数据未加载，先触发加载
  if(!yearData(curY)){
    loadDecade(curY);
    _pendingY=curY;
    return; // 数据加载后由 _onDataLoaded 重绘
  }
  _pendingY=null;
  document.getElementById("ymTitle").textContent=`${curY}年 ${curM}月`;
  const dim=MONTHS[curM-1]+(curM===2&&isLeap(curY)?1:0), start=firstWeekday(curY,curM);
  const grid=document.getElementById("calGrid"); grid.innerHTML="";
  document.getElementById("calWeek").innerHTML=WEEK.map(w=>`<span>${w}</span>`).join("");
  for(let i=0;i<start;i++)grid.appendChild(emptyCell());
  const today=new Date(); const todayStr=`${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  for(let d=1;d<=dim;d++){
    const ds=`${curY}-${pad(curM)}-${pad(d)}`, r=dayRec(ds);
    const cell=document.createElement("div"); cell.className="cal-day";
    if(ds===todayStr)cell.classList.add("today");
    if(ds===selDate)cell.classList.add("sel");
    let lunar="";
    if(r){
      lunar=(r.ld===1)?(r.lg<0?"闰"+LUNAR_MONTH[-r.lg-1]:LUNAR_MONTH[r.lg-1])+"月":LUNAR_DAY[r.ld-1];
      if(r.st&&JIEQI[r.st]){lunar=r.st;cell.classList.add("jieqi");}
    }
    cell.innerHTML=`<span>${d}</span><span class="lunar">${lunar||""}</span>`;
    cell.onclick=()=>{selDate=ds;renderCal();};
    grid.appendChild(cell);
  }
  const rem=(7-(start+dim)%7)%7; for(let i=0;i<rem;i++)grid.appendChild(emptyCell());
}
function emptyCell(){const d=document.createElement("div");d.className="cal-day empty";return d;}
/* 年份快速跳转：点击「2026年 1月」标题 → 内联输入框，回车/失焦生效 */
function jumpYear(){
  const t=document.getElementById("ymTitle");
  if(!t)return;
  const inp=document.createElement("input");
  inp.type="number"; inp.min=1900; inp.max=2060; inp.value=curY;
  inp.style.width="86px"; inp.style.fontSize="16px"; inp.style.fontWeight="600";
  inp.style.background="var(--surface)"; inp.style.color="var(--brand_gold)";
  inp.style.border="1px solid var(--brand_gold)"; inp.style.borderRadius="8px";
  inp.style.padding="2px 8px"; inp.style.fontFamily="inherit";
  t.replaceWith(inp); inp.focus(); inp.select();
  const commit=()=>{
    const n=parseInt(inp.value)||0;
    if(n>=1900&&n<=2060&&n!==curY){ curY=n; }
    const span=document.createElement("span");
    span.className="ym"; span.id="ymTitle";
    inp.replaceWith(span); span.onclick=jumpYear;
    renderCal();
  };
  inp.onkeydown=(e)=>{
    if(e.key==="Enter")commit();
    if(e.key==="Escape"){ const span=document.createElement("span");span.className="ym";span.id="ymTitle";inp.replaceWith(span);span.onclick=jumpYear;renderCal(); }
  };
  inp.onblur=commit;
}
function shiftMonth(delta){
  curM+=delta;
  if(curM<1){curM=12;curY--;}
  if(curM>12){curM=1;curY++;}
  if(curY<1900)curY=1900;
  if(curY>2060)curY=2060;
  renderCal();
}
/* 数据加载完成回调：重绘日历 */
window._onDataLoaded=function(){
  if(_pendingY){ renderCal(); }
};
function renderShichen(){
  document.getElementById("scGrid").innerHTML=SHICHEN.map(s=>`
    <div class="sc-item${s.name===selHour?" sel":""}" onclick="pickHour('${s.name}')">
      <div class="sc">${s.name}时</div><div class="sc-time">${s.start.slice(0,2)}-${s.end.slice(0,2)}</div>
    </div>`).join("");
}
function pickHour(h){selHour=h;renderShichen();}

/* ============ 排盘引擎（薄包装 → core/liuren-core.js）============ */
function buildChart(){
  return LiurenCore.buildChart({date: selDate, hourZhi: selHour, calData: window.CAL, yjAll: window.YJ_ALL});
}

/* ============ 盘态计算（旬空/旺衰/气机点/冲合刑害/月将·贵人助日/神煞/毕法格局）→ core/liuren-core.js ============ */
/* 毕法格局区（随用神·动态三传评估 + 占事相关过滤 + 默认折叠）*/
let bifaItems=[], bifaExpanded={}, bifaLastYS=null;
function toggleBifa(no){ bifaExpanded[no]=!bifaExpanded[no]; renderBifaSection(); }
function renderBifaSection(){
  const box=document.getElementById("lsBifa");
  if(!box||!chartC||!curYongshen)return;
  const c=chartC;
  const c1=curYongshen, c2=c.tp[c1], c3=c.tp[c2];
  bifaItems=LiurenCore.renderBifaForChuans(c,c.dx,[{z:c1},{z:c2},{z:c3}],curAffair);
  if(bifaLastYS!==curYongshen){ bifaLastYS=curYongshen; bifaExpanded={}; const r0=bifaItems.find(x=>x.相关); if(r0)bifaExpanded[r0["序"]]=true; }
  const itemHtml=b=>{
    const open=!!bifaExpanded[b["序"]];
    const body=open?`<div class="bf-body" style="display:block">`+["定性","定象","定时","定策","定级"].map(k=>b.layer[k]?`<div class="l"><b>${k}：</b>${b.layer[k]}</div>`:"").join("")+`</div>`:"";
    return `<div class="bf-item"><div class="bf-head" onclick="toggleBifa(${b["序"]})">`+
      `${b.相关?`<span class="star">⭐</span>`:""}<b>${b.法名}</b><span class="tag">「${b.赋文}」·${b.判}</span><span class="tag" style="margin-left:auto">${open?"▴":"▾"}</span>`+
      `</div>${body}</div>`;
  };
  /* 毕法教练栏：组合断 + 建议汇总 */
  let coachHtml="";
  try{
    const coach=LiurenCore.bifaCoach(c.dx.bifa, window.BIFA_COACH||{});
    if(coach.items.length){
      const tone=coach.xiong>coach.ji?"var(--brand_cinnabar)":"var(--brand_gold)";
      coachHtml=`<div class="bf-coach" style="padding:10px 12px;border-radius:12px;background:${coach.xiong>coach.ji?"rgba(208,112,74,.10)":"rgba(233,200,120,.08)"};border:1px solid ${coach.xiong>coach.ji?"rgba(208,112,74,.35)":"rgba(233,200,120,.25)"};margin-bottom:8px;">
        <div style="color:${tone};font-size:13px;font-weight:600;">🧭 ${coach.summary}</div>
        ${coach.groups.length?`<div style="color:var(--text_secondary);font-size:12px;margin-top:4px;">${coach.groups.map(g=>"· "+g).join("<br>")}</div>`:""}
        ${coach.advice.length?`<div style="color:var(--text_secondary);font-size:12px;margin-top:4px;">建议：${coach.advice.join("；")}</div>`:""}
      </div>`;
    }
  }catch(e){ coachHtml=""; }
  const rel=bifaItems.filter(x=>x.相关), rest=bifaItems.filter(x=>!x.相关);
  const relHtml=rel.map(itemHtml).join("");
  const restHtml=rest.length?
    `<div class="bf-muted">其它格局（与此占事关联弱，点击展开）：${rest.map(b=>`<span style="cursor:pointer;color:var(--brand_gold)" onclick="toggleBifa(${b["序"]})">${b.法名}</span>`).join("、")}</div>`+
    `<div>${rest.filter(b=>bifaExpanded[b["序"]]).map(itemHtml).join("")}</div>`:"";
  box.innerHTML=coachHtml+`<div class="t">毕法格局（随用神 · 动态三传 ${c1}→${c2}→${c3}）</div>${relHtml}${restHtml}`+
    `<div class="bf-muted">格局由四课三传定位（天地盘为原料），用神即初传——换用神格局随之变</div>`;
  renderNianming();
}

/* ===== 中黄五变经：变干断课 + 遁干三层 ===== */
function renderZhonghuang(){
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
function setZhMode(m){ zhMode=m; renderZhonghuang(); }
/* 年命适配：选年命地支 → 上神/六亲/空亡/旺衰 + 建议；行年小运：出生年+性别 */
let curNianZhi="", curBirthYear=1990, curGender="男";
function renderNianming(){
  const box=document.getElementById("lsNianming");
  if(!box)return;
  if(!chartC){
    box.innerHTML=`<div class="ls-empty" style="padding:10px;color:var(--text_secondary);font-size:12px;">排盘后可选年命地支，查看个性化建议；输入出生年+性别看行年小运</div>`;
    return;
  }
  const chips=LiurenCore.ZHI.map(z=>
    `<span class="ls-chip${z===curNianZhi?" on":""}" onclick="pickNian('${z}')" style="display:inline-block;padding:4px 12px;border-radius:12px;margin:0 6px 6px 0;font-size:13px;${z===curNianZhi?"background:var(--brand_gold);color:#1A1410;":"background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);"}">${z}</span>`).join("");
  let body="";
  if(curNianZhi){
    const na=LiurenCore.nianmingAdvice(chartC,curNianZhi,curYongshen||"");
    body=`<div style="margin-top:6px;font-size:13px;color:var(--brand_gold);">年命${na.nianZhi} · 上神${na.shangShen}（${na.liuqin}）${na.kong?"·空":""} ${na.wangShuai}${na.rel?` · 与用神${na.rel}`:""}</div>
      <div style="font-size:12px;color:var(--text_secondary);line-height:1.8;">${na.advice}</div>`;
  }
  /* 行年小运：出生年 + 性别 → 本命/行年/上神 */
  const cy=parseInt(selDate.slice(0,4))||curY;
  let xn="";
  if(curBirthYear>=1900 && curBirthYear<=cy){
    try{
      const x=LiurenCore.xingNian(chartC,curBirthYear,cy,curGender,curYongshen||"");
      xn=`<div style="margin-top:8px;border-top:1px dashed var(--divider);padding-top:8px;">
        <div style="font-size:12px;color:var(--text_secondary);margin-bottom:6px;">行年小运</div>
        <div style="font-size:13px;margin-bottom:6px;">出生年
          <input id="xnBirth" type="number" min="1900" max="${cy}" value="${curBirthYear}" style="width:64px;padding:3px 6px;border-radius:8px;border:1px solid var(--divider);background:var(--surface);color:var(--text_primary);font-size:13px;">
          ${["男","女"].map(g=>`<span class="ls-chip${curGender===g?" on":""}" onclick="pickGender('${g}')" style="display:inline-block;padding:3px 12px;border-radius:12px;margin-left:6px;font-size:13px;${curGender===g?"background:var(--brand_gold);color:#1A1410;":"background:var(--surface);color:var(--text_primary);border:1px solid var(--divider);"}">${g}</span>`).join("")}
        </div>
        <div style="font-size:13px;color:var(--brand_gold);">本命${x.benMingGan}${x.benMingZhi}（${x.shun?"顺行":"逆行"}）· 行年${x.xingNianZhi} · 上神${x.shangShen}（${x.liuqin}）${x.kong?"·空":""} ${x.wangShuai}</div>
        ${x.rel?`<div style="font-size:12px;color:var(--text_secondary);">与用神${x.yongShen}：${x.rel}</div>`:""}
        <div style="font-size:12px;color:var(--text_secondary);">流年·${x.tsRel}${x.jiang?` · 乘将${x.jiang}（${x.jiangJx}）`:""}</div>
        <div style="font-size:14px;font-weight:600;color:${x.band==="大吉"||x.band==="吉"?"var(--brand_gold)":(x.band==="凶"||x.band==="大凶")?"var(--brand_cinnabar)":"var(--text_primary)"};">研习参考 · 吉凶权重 ${x.score}分（${x.band}）</div>
        <div style="font-size:12px;color:var(--text_secondary);line-height:1.8;">${x.advice}</div>
        <div style="font-size:11px;color:var(--text_tertiary);margin-top:4px;">注：行年起法依《六壬大全》本命起数；《集要》另法存疑未采；吉凶分为五层参考值非定论</div>
      </div>`;
    }catch(e){ xn=""; }
  }
  box.innerHTML=`<div style="font-size:12px;color:var(--text_secondary);margin-bottom:4px;">年命适配</div>${chips}${body}${xn}`;
  const inp=document.getElementById("xnBirth");
  if(inp){
    inp.onchange=()=>{
      const v=parseInt(inp.value)||0;
      if(v>=1900&&v<=cy){ curBirthYear=v; renderNianming(); }
    };
  }
}
function pickNian(z){ curNianZhi=z; renderNianming(); }
function pickGender(g){ curGender=g; renderNianming(); }


/* ============ 渲染 ============ */
const NS="http://www.w3.org/2000/svg",CX=260,CY=260;
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
function zAng(i){return (i*30+180)%360;}
function zAngOf(z){return zAng(ZHI.indexOf(z));}
function xy(r,deg){const rad=(deg-90)*Math.PI/180;return [CX+r*Math.cos(rad),CY+r*Math.sin(rad)];}
function css(v){return getComputedStyle(document.body).getPropertyValue(v).trim();}

let zhMode="旬"; // 遁干模式：旬/日遁/时遁
let showDunDi=false, showBenshen=false; // 辅助层开关
function doAncientChart(){
  const mj=document.getElementById("ancMj").value.replace("将","");
  const dg=document.getElementById("ancDg").value;
  const dz=document.getElementById("ancDz").value;
  const hz=document.getElementById("ancHz").value.replace("时","");
  const yg=document.getElementById("ancYG").value||"";
  const yz=document.getElementById("ancYZ").value||"";
  const mz=document.getElementById("ancMZ").value||"";
  // ① 日干支阴阳匹配
  if(!LiurenCore.validGanZhi(dg,dz)){alert("日干支不合："+dg+dz+"（阳干配阳支/阴干配阴支，60甲子中不存在）");return;}
  // ② 年干支须成对
  if((!!yg)!==(!!yz)){alert("年干支需同时填写天干与地支（当前只填了"+(yg?"年干":"年支")+"）");return;}
  // ②b 年干支阴阳匹配
  if(yg&&yz&&!LiurenCore.validGanZhi(yg,yz)){alert("年干支不合："+yg+yz+"（阴阳不配，不存在）");return;}
  // ③ 月将×月支匹配
  if(mz){
    const exp=LiurenCore.yuejiangForMonth(mz);
    if(exp!==mj){alert(mz+"月（"+mz+"支）月将应为"+exp+"将，非"+mj+"将");return;}
  }
  const c=LiurenCore.buildChartAncient(mj,dg,dz,hz,yg,yz,mz);
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
function doChart(){
  chartBuilt=true;
  const c=buildChart();
  if(!c)return;
  chartC=c; // 供抓用神模块使用
  const zh=LiurenCore.zhonghuangDun(c,selHour);
  chartC.zh_riDun=zh.riDun; chartC.zh_shiDun=zh.shiDun;
  chartC.zh_shiGan=zh.shiGan; chartC.zh_bianGan=zh.bianGan; chartC.zh_hourZhi=zh.hourZhi;
  chartC.zh_ana=LiurenCore.zhonghuangAnalyze(c,selHour);
  renderZhonghuang();
  // ① 四柱与月将（立即）
  renderSizhu(c);
  // ② 天盘旋转就位（动画）
  drawDiskAnimated(c);
  // ③ 四课浮现
  setTimeout(()=>renderKeg(c),700);
  // ④ 三传浮现
  setTimeout(()=>renderChuan(c),1400);
  // ⑤ 完整盘面（动画结束后重绘静态终态，含三传标记）
  setTimeout(()=>{ drawDisk(c); if(curAffair) runLeishen(); else showLeishenReady(); },2200);
}
function renderSizhu(c){
  const {r,yj,hourGan:c_hg}=c;
  const lunar=(r.lg<0?"闰"+LUNAR_MONTH[-r.lg-1]:LUNAR_MONTH[r.lg-1])+"月"+LUNAR_DAY[r.ld-1];
  document.getElementById("calInfo").textContent=`${selDate} ${selHour}时 · ${r.wk} · 农历${lunar}`;
  document.getElementById("sizhu").innerHTML=[
    ["年",r.ygc],["月",r.mg+r.mz],["日",r.dg+r.dz],["时",c_hg+selHour],["月将",yj.zhi]
  ].map(x=>`<div class="gz-pill"><div class="k">${x[0]}</div><div class="v">${x[1]}</div></div>`).join("");
}
/* 天盘（月将加时）：天盘支直接渲染在加临后的地盘宫位上
   月将（地支）置于地盘上对应占时（地支）的宫位之上为起点，顺行覆盖各宫
   例：月将午加巳时 → 地盘巳宫=午、地盘午宫=未、地盘未宫=申 …
   盘面布局（传统）：外圈=天将（接天盘外）→ 天盘十二支 → 遁干 → 内圈=地盘十二支 → 中心 */
function drawDiskAnimated(c){
  const svg=document.getElementById("disk");svg.innerHTML="";
  const {tp,dun,jiangMap}=c;
  const gold=css("--brand_gold"),line=css("--divider"),text=css("--text_primary"),t2=css("--text_secondary");
  const cin=css("--brand_cinnabar"),ver=css("--brand_verdigris"),por=css("--brand_porcelain");
  const tl=css("--tian_line"),dbg=css("--disk_bg"),tbg=css("--tian_bg");
  el("circle",{cx:CX,cy:CY,r:246,fill:dbg,stroke:line,"stroke-width":2},svg);
  el("circle",{cx:CX,cy:CY,r:198,fill:"none",stroke:line,"stroke-width":1},svg);
  el("circle",{cx:CX,cy:CY,r:190,fill:"none",stroke:tl,"stroke-width":1.6,"stroke-dasharray":"5 4"},svg);
  el("circle",{cx:CX,cy:CY,r:160,fill:"none",stroke:line,"stroke-width":1},svg);
  el("circle",{cx:CX,cy:CY,r:126,fill:tbg,stroke:tl,"stroke-width":1.2},svg);
  el("circle",{cx:CX,cy:CY,r:118,fill:"none",stroke:line,"stroke-width":1},svg);
  el("circle",{cx:CX,cy:CY,r:58,fill:"none",stroke:line,"stroke-width":1,"stroke-dasharray":"2 3"},svg);
  for(let i=0;i<12;i++){
    const z=ZHI[i],g=el("g",{},svg);
    /* 外圈：天将（接天盘外） */
    const [jx,jy]=xy(178,zAng(i));
    const j=jiangMap[z],jcol=JIANG_JX[j]==="凶"?cin:(JIANG_JX[j]==="吉"?ver:por);
    el("circle",{cx:jx,cy:jy,r:13,fill:"rgba(0,0,0,.08)",stroke:jcol,"stroke-width":1},g);
    el("text",{x:jx,y:jy,"text-anchor":"middle","dominant-baseline":"central",fill:jcol,"font-size":9},g).textContent=j;
    /* 外圈：天盘支（月将加时后加临于地盘宫位） */
    const tz=tp[z]; // 地盘宫 z 上方的天盘支（地盘巳=午、地盘午=未…）
    const [tx,ty]=xy(230,zAng(i));
    const tc=el("circle",{cx:tx,cy:ty,r:16,fill:"rgba(0,0,0,.10)",stroke:tl,"stroke-width":1},g);
    tc.style.cursor="pointer"; tc.onclick=(e)=>{e.stopPropagation();pickCustomZhi(tz,"天盘");};
    const tt=el("text",{x:tx,y:ty,"text-anchor":"middle","dominant-baseline":"central",fill:gold,"font-size":18,"font-weight":"700"},g);
    tt.textContent=tz; tt.style.cursor="pointer"; tt.onclick=(e)=>{e.stopPropagation();pickCustomZhi(tz,"天盘");};
    el("text",{x:tx,y:ty+21,"text-anchor":"middle","dominant-baseline":"central",fill:gold,"font-size":8,"opacity":.8},g).textContent=dun[tz];
    /* 中圈：遁干（地盘干；zhMode: 旬/日遁/时遁） */
    const [gx,gy]=xy(144,zAng(i));
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
    }
    /* 内圈：地盘十二支（固定） */
    const [ex,ey]=xy(108,zAng(i));
    const ec=el("circle",{cx:ex,cy:ey,r:12,fill:"rgba(0,0,0,.06)",stroke:line,"stroke-width":1},g);
    ec.style.cursor="pointer"; ec.onclick=(e)=>{e.stopPropagation();pickCustomZhi(z,"地盘");};
    const et=el("text",{x:ex,y:ey,"text-anchor":"middle","dominant-baseline":"central",fill:text,"font-size":17,"font-weight":"600"},g);
    et.textContent=z; et.style.cursor="pointer"; et.onclick=(e)=>{e.stopPropagation();pickCustomZhi(z,"地盘");};
  }
  // 中心提示
  el("text",{x:CX,y:CY-6,"text-anchor":"middle","dominant-baseline":"central",fill:gold,"font-size":15,"font-weight":"700"},svg).textContent=c.r.dg+c.r.dz+"日";
  el("text",{x:CX,y:CY+16,"text-anchor":"middle",fill:t2,"font-size":10},svg).textContent=`月将${c.yj.zhi}加${selHour}时`;
}
function renderKeg(c){
  const {r,kegs,dun,jiangMap,tp}=c;
  // 传统右起：第一课在右（干上神），向左依次 干阴/支上神/支阴
  const arr=[...kegs].reverse(), names=["支阴","支上神","干阴","干上神"];
  document.getElementById("kegGrid").innerHTML=arr.map((k,i)=>{
    const n=4-i;
    return `<div class="keg" style="animation:fadeIn .4s ${i*0.08}s both">
      <div class="kn">第${n}课 · ${names[i]}</div>
      <table>
        <tr><td>下神</td><td class="xia">${i===3?r.dg:dun[k.s]+k.s}</td></tr>
        <tr><td>上神</td><td class="gzx">${dun[k.x]+k.x}</td></tr>
        <tr><td>天将</td><td style="font-size:12px">${jiangMap[LiurenCore.gongOf(tp,k.x)]}</td></tr>
      </table></div>`;
  }).join("");
}
function renderChuan(c){
  const {r,sanchuan,tp,jiangMap}=c;
  /* 课体课显示课体名（伏吟/返吟/八专/别责/昴星…），普通课显示宗门法 */
  const title = (sanchuan.keti && sanchuan.keti !== '') ? sanchuan.keti : sanchuan.method;
  document.getElementById("zongmen").textContent=`九宗门 · ${title}`;
  const cls=["c1","c2","c3"];
  document.getElementById("chuanRow").innerHTML=sanchuan.chuans.map((ch,i)=>{
    const w=WX[ch.z], dw=WXG[r.dg];
    let lq;
    if(w===dw)lq="兄弟";
    else if(KE[dw]===w)lq="妻财";
    else if(KE[w]===dw)lq="官鬼";
    else if(SHENG(dw)===w)lq="子孙";
    else lq="父母";
    const gong=LiurenCore.gongOf(tp,ch.z);
    return `<div class="chuan ${cls[i]}" style="animation:fadeIn .4s ${i*0.12}s both">
      <div class="pos">${["初传","中传","末传"][i]}</div>
      <div class="gz">${ch.gz}</div>
      <div class="liuqin">${lq}</div>
      <div class="jiang">临${jiangMap[gong]}</div>
    </div>`;
  }).join("");
}
function SHENG(a){return {木:"火",火:"土",土:"金",金:"水",水:"木"}[a];}

/* ============ 抓用神模块（管辂神书·类神活断）============ */
/* 所占之事 → 类神候选（六亲 + 天将 + 地支取象）*/
const AFFAIRS={
  "求财":   {liuqin:["妻财"],jiang:["青龙","玄武"],zhi:["申"],note:"财爻+青龙主正财，玄武主暗财；申为财宝之地"},
  "求官":   {liuqin:["官鬼","父母"],jiang:["贵人","太常","青龙"],zhi:["寅","申"],note:"官鬼为官星，父母为印绶，贵人荐引，太常印绶"},
  "婚姻":   {liuqin:["妻财","官鬼"],jiang:["六合","天后","青龙"],zhi:["卯","酉"],note:"六合主媒合，天后主女，青龙主妻，卯酉为门户"},
  "疾病":   {liuqin:["子孙"],jiang:["白虎","螣蛇"],zhi:["午"],note:"白虎主病，子孙为医药解神，午为朱雀病符之位"},
  "官司":   {liuqin:["官鬼"],jiang:["勾陈","朱雀"],zhi:["辰","午"],note:"勾陈主官讼，朱雀主口舌文书，辰午官符之地"},
  "出行":   {liuqin:[],jiang:["青龙","白虎"],zhi:["申","子","午"],note:"申为传送道路，子午二至之路，二马主动"},
  "失物":   {liuqin:["妻财"],jiang:["玄武","天空"],zhi:["亥","子"],note:"玄武主盗，财爻为失物，亥子玄武本位"},
  "学业":   {liuqin:["父母"],jiang:["朱雀","贵人"],zhi:["巳","午"],note:"父母为印绶文书，朱雀主文字，午朱雀本位"},
  "家宅":   {liuqin:[],jiang:["太常","青龙"],zhi:["卯","酉"],note:"支为宅，卯酉为门户，青龙主宅旺"},
  "行人":   {liuqin:[],jiang:["朱雀","白虎"],zhi:["申","子","午"],note:"申传送，子午道路，朱雀主音信，白虎主道路"},
  "六畜":   {liuqin:["妻财"],jiang:[],zhi:["丑","午"],note:"丑牛午马，财爻主六畜，看地分生旺"},
  "求谋":   {liuqin:["比肩"],jiang:["六合","青龙"],zhi:["寅"],note:"比肩为同类相扶，六合和合，青龙吉利"}
};
const JIANG_BENWEI={"贵人":"丑","螣蛇":"巳","朱雀":"午","六合":"卯","勾陈":"辰","青龙":"寅","天空":"戌","白虎":"申","太常":"未","玄武":"亥","太阴":"酉","天后":"子"};

/* ===== 管辂象意断语（《管辂六壬杂占神书》歌诀象意库 v1.2.0 简体）===== */
/* 注：LIUQIN_ZHI / GUANLU_DUYU / AFFAIR_XIANGYI / AFFAIR_KW / TIANJIANG_LEIXIANG
   已抽入核心 liuren-core.js 的 class YongShenCore（与鸿蒙端同构），此处不再重复声明
   （重复 const 会导致 Identifier already declared，整个脚本中断） */
/* ===== 占事体系（载自 _data/zhan_shi.js：用神配置 + 古门类映射 + 场景提示词 + 信息提示）===== */
let SCENE_WORDS={}, AFFAIR_INFO={};
if(window.ZHANSHI&&ZHANSHI["占事大类"]){
  ZHANSHI["占事大类"].forEach(it=>{
    const nm=it["名称"];
    const cfg={liuqin:it["用神"]["六亲"],jiang:it["用神"]["天将"],zhi:it["用神"]["地支"],note:it["断语倾向注"]||""};
    if(AFFAIRS[nm]) cfg.note=it["断语倾向注"]||AFFAIRS[nm].note;
    AFFAIRS[nm]=cfg;
    AFFAIR_XIANGYI[nm]=it["古门类"]||["杂占"];
    SCENE_WORDS[nm]=it["场景提示词"]||[];
    AFFAIR_INFO[nm]=it["信息提示"]||"";
  });
}
let xiangyiTick=0;
/* ===== 用神节点卡：类象词云 + 起爆点 ===== */
/* TIANJIANG_LEIXIANG 已抽入核心（见上注），此处不再重复声明 */
let curAnchor=null, curWords=[];
function anchorJieDian(i){
  curAnchor=(curWords[i]&&curWords[i].v===curAnchor)?null:(curWords[i]?curWords[i].v:null);
  renderJieDian(); renderXiangyi();
}
function jieDianWords(c,z){
  /* 词云已抽入核心 YongShenCore.jieDianWords（与鸿蒙端同构，两端共用类象库） */
  return YongShenCore.jieDianWords(c,z,window.DUXIANG_LEIXIANG||{});
}
function renderJieDian(){
  const box=document.getElementById("lsJieDian");
  if(!box||!chartC)return;
  const c=chartC, z=curYongshen, dx=c.dx, r=c.r;
  const g=c.dun[z], j=c.jiangMap[LiurenCore.gongOf(c.tp,z)]||"";
  const nd=dx.nodes[z], rel=dx.relations[z];
  const liuqin=(()=>{const w=WX[z],dw=WXG[r.dg];if(w===dw)return"兄弟";if(KE[dw]===w)return"妻财";if(KE[w]===dw)return"官鬼";if(SHENG(dw)===w)return"子孙";return"父母";})();
  curWords=jieDianWords(c,z);
  if(curAnchor&&!curWords.some(w=>w.v===curAnchor)) curAnchor=null;
  const boom=[];
  if(nd.kong)boom.push("落空（虚而不实，等出空）");
  if(rel.chong)boom.push("被"+rel.chong+"冲（提前反转）");
  if(rel.he)boom.push("合"+rel.he+"（缓势被绊）");
  if(rel.hai)boom.push("害"+rel.hai);
  if(rel.xing.length)boom.push("刑"+rel.xing.join(""));
  const dg=WXG[r.dg],zw=WX[z];
  const gk=dg===zw?"比肩":(KE[dg]===zw?"我克(财)":(KE[zw]===dg?"克我(官鬼)":(SHENG(dg)===zw?"我生(子孙)":"生我(父母)")));
  boom.push("与日干："+gk);
  const ss=dx.shensha&&dx.shensha.byZhi[z]||[];
  const ssTxt=ss.length?"带"+ss.map(n=>n.split("(")[0]).join("·"):"无凶煞";
  box.innerHTML=
    `<div class="jd-head">用神节点 ${g}${z} · ${liuqin} · 乘${j} <span class="sub">${nd.wangShuai}${nd.kong?"·空":""}${nd.qiJi?"·"+nd.qiJi:""}</span></div>`+
    `<div class="jd-cloud">`+curWords.map((w,i)=>`<span class="jd-chip${curAnchor===w.v?" on":""}" title="${w.k}：${w.v}" onclick="anchorJieDian(${i})">${w.k.split("·")[1]||w.k}<span class="v">：${w.v.slice(0,14)}${w.v.length>14?"…":""}</span></span>`).join("")+`</div>`+
    `<div class="jd-boom">起爆点：${boom.join(" · ")}<br>所带神煞：<b>${ssTxt}</b></div>`;
}
/* 盘态·气机链（原型格式：月建→旺衰(白话注)→十二长生(日支宫)→气机点(下一气机)→冲宫）+ 旬空/月将贵人助日 + 用神状态 */
const WANG_GLOSS={旺:"当令得势，正值强盛",相:"有人帮，顺势上",休:"出过力，先歇后养",囚:"受令压制，宜守不宜攻",死:"气竭无援，静待转机"};
function toggleQjTable(el){
  const tb=el.closest(".qj-chain")&&el.closest(".qj-chain").querySelector(".qj-table");
  if(tb){ const show=tb.style.display!=="block"; tb.style.display=show?"block":"none"; el.textContent=show?"[收起]":"[展开]"; }
}
function renderPanTai(){
  const box=document.getElementById("lsPanTai");
  if(!box)return;
  const c=chartC, dx=c&&c.dx;
  if(!dx)return;
  const r=c.r, yjS=dx.yuejiang, gr=dx.guiren;
  const QJ=(window.DUXIANG_RULES&&window.DUXIANG_RULES["十二宫气机点"])||{};
  const qj12=QJ["十二宫"]||{};
  const gongs=["长生","沐浴","冠带","临官","帝旺","衰","病","死","墓","绝","胎","养"];
  const yang=!!G_YANG[r.dg];
  const rzGong=dx.nodes[r.dz].qiJi||"", rzIdx=gongs.indexOf(rzGong);
  const nextZhi=yang?ZHI[(ZHI.indexOf(r.dz)+1)%12]:ZHI[(ZHI.indexOf(r.dz)-1+12)%12];
  const ng=dx.nodes[nextZhi].qiJi||"", ngItem=qj12[ng]||{};
  const ngGloss=yang?(ngItem["阳干顺"]||""):(ngItem["阴干逆"]||"");
  const chong=(dx.relations[nextZhi]||{}).chong||"";
  const wGloss=WANG_GLOSS[dx.dayWangShuai]||"";
  const stT=x=>{const t=[];if(x.kong)t.push("空");if(x.wangShuai==="旺"||x.wangShuai==="相")t.push("旺");else if(x.wangShuai==="休"||x.wangShuai==="囚")t.push("弱");else if(x.wangShuai==="死")t.push("死");return t.join("");};
  const yjT=`月将${yjS.zhi}@${yjS.gong}宫${stT(yjS)}·${yjS.zhu?"助日✓":"不助日"}`;
  const grT=`贵人@${gr.zhi}宫${stT(gr)}·${gr.zhu?"助日✓":"不助日"}`;
  // 十二宫全表（[展开] 内容：每宫→地支 + 本干象义，标出 日支宫 ● 与 气机点 ○）
  const gzOf={}; ZHI.forEach(z=>{ gzOf[dx.nodes[z].qiJi]=z; });
  const qjTable=gongs.map(g=>{
    const it=qj12[g]||{}, gz=gzOf[g]||"—";
    const mark=g===rzGong?" ●当前":(g===ng?" ○气机点":"");
    return `<tr><td>${g}${mark}</td><td>${gz}</td><td style="color:var(--text_secondary)">${yang?(it["阳干顺"]||""):(it["阴干逆"]||"")}</td></tr>`;
  }).join("");
  const yongshen=curYongshen, nd=dx.nodes[yongshen], rel=dx.relations[yongshen];
  const cur=curCandidates.find(c0=>c0.zhi===yongshen)||{};
  const jiang=cur.jiang||c.jiangMap[LiurenCore.gongOf(c.tp,yongshen)]||"";
  const dg=WXG[r.dg], zw=WX[yongshen];
  const gk=dg===zw?"比肩":(KE[dg]===zw?"我克(财)":(KE[zw]===dg?"克我(官鬼)":(SHENG(dg)===zw?"我生(子孙)":"生我(父母)")));
  const relT=[rel.chong?"冲"+rel.chong:"",rel.he?"合"+rel.he:"",rel.hai?"害"+rel.hai:"",rel.xing.length?"刑"+rel.xing.join(""):""].filter(Boolean).join("·")||"无冲合";
  box.innerHTML=
    `<div class="ls-pantai-title">盘态 · 气机链<span class="info">日干${r.dg} · ${r.mg+r.mz}月</span></div>
     <div class="qj-chain">
       <div class="qj-row"><span class="qj-k">月建</span><b>${dx.monthZhi}</b><span class="qj-k">旺衰状态</span><b>${dx.dayWangShuai}</b><span class="qj-g">（${wGloss}）</span></div>
       <div class="qj-arrow">➔</div>
       <div class="qj-row"><span class="qj-k">十二长生</span><b>${rzGong}</b>（${r.dg}${r.dz} · ${yang?"顺排":"逆排"}）<span class="qj-swap" onclick="toggleQjTable(this)">[展开]</span></div>
       <div class="qj-arrow">⬇</div>
       <div class="qj-row"><span class="qj-k">气机点</span><b style="color:var(--brand_cinnabar)">${nextZhi}</b>（${ng}）<span class="qj-g">「${ngGloss}」</span></div>
       <div class="qj-row"><span class="qj-k">冲宫</span><b style="color:var(--brand_cinnabar)">${chong}</b><span class="qj-g">（提前窗口）</span></div>
       <div class="qj-table" style="display:none"><table style="width:100%;font-size:12px;border-collapse:collapse;margin-top:6px;"><tr style="color:var(--text_secondary)"><th>宫</th><th>支</th><th>象义</th></tr>${qjTable}</table></div>
     </div>
     <div style="margin-top:8px;font-size:var(--fs_body_s);color:var(--text_secondary);line-height:1.8;">
       旬空${dx.xunkong.join("")} · ${yjT} · ${grT}<br>
       用神<b style="color:var(--brand_cinnabar)">${yongshen}</b>宫：${nd.wangShuai}${nd.kong?"·空亡":""}${nd.qiJi?"·"+nd.qiJi:""}${jiang?" 乘"+jiang:""} · 与日干：${gk} · ${relT}
     </div>`;
}
function renderXiangyi(){
  const box=document.getElementById("lsXiangyi");
  if(!box)return;
  /* 选句逻辑已抽入核心 YongShenCore.selectDuyu（与鸿蒙端同构，两端共用打分/收光） */
  const aff=curAffair?YongShenCore.affairByName(curAffair):null;
  if(!aff||!chartC)return;
  const pick=YongShenCore.selectDuyu(chartC,aff,curCandidates,curYongshen,window.GUANLU_XIANGYI||{},xiangyiTick,curAnchor||"");
  if(!pick.items.length){ box.style.display="none"; return; }
  box.style.display="block";
  const cut=t=>t.length>150?t.slice(0,150)+"…":t;
  box.innerHTML=
    `<div class="shouguang" title="收光一句 · 点击换一条" onclick="xiangyiTick++;renderXiangyi()" style="cursor:pointer;">${pick.shouGuang}</div>`+
    `<div class="t">管辂象意直断（按盘态信号选句）<span class="swap" onclick="xiangyiTick++;renderXiangyi()">🔄 换一条</span></div>`+
    pick.items.map(e=>{
      const ev=e.ev||[];
      return `<div class="g">◎ ${e.ge}${ev.length?` <span class="ev">✓${ev.join("·")}</span>`:""}</div><div class="txt" title="${(e.yi||"").replace(/"/g,"&quot;")}">${cut(e.yi||"（无释义）")}</div>`;
    }).join("")+
    `<div class="from">据《管辂六壬杂占神书》歌诀象意库 v1.2.0 · 点上方收光句或类象词可重选</div>`;
}

let curAffair=null, chartC=null, curYongshen=null, curCandidates=[], curJiangZhis=[];
function renderAffairChips(){
  const names=Object.keys(AFFAIRS);
  const scene=curAffair?(SCENE_WORDS[curAffair]||[]):[];
  const info=curAffair?(AFFAIR_INFO[curAffair]||""):"";
  document.getElementById("lsAffair").innerHTML=
    '<div style="width:100%;font-size:var(--fs_caption_l);color:var(--text_secondary);margin-bottom:4px;">所占之事</div>'+
    names.map(n=>`<span class="ls-chip${n===curAffair?" on":""}" onclick="pickAffair('${n}')">${n}</span>`).join("")+
    ((scene.length||info)?
      `<div style="margin-top:6px;font-size:var(--fs_caption_l);color:var(--text_secondary);line-height:1.8;">`+
      (scene.length?`<span style="color:var(--brand_gold)">落象提示：</span>${scene.join(" · ")}<br>`:"")+
      (info?`<span style="color:var(--brand_verdigris)">${info}</span>`:"")+
      `</div>`:"");
}
function pickAffair(name){
  curAffair=name;
  curYongshen=null;
  curAnchor=null;
  customYongShen=false; /* 切占事 → 回到占事驱动 */
  renderAffairChips();
  if(chartC) runLeishen();
  else{
    document.getElementById("lsEmpty").style.display="block";
    document.getElementById("lsBody").style.display="none";
    document.getElementById("lsEmpty").textContent="⚠️ 尚未排盘——请先在左侧选择日期与时辰，点击「排盘」后，再点「"+name+"」即可抓取类神";
  }
}
/* 抓用神主流程 */
function runLeishen(){
  if(!curAffair||!chartC)return;
  const c=chartC, r=c.r;
  const aff=AFFAIRS[curAffair];
  /* 候选生成已抽入核心 YongShenCore.candidates（与鸿蒙端同构，两端共用） */
  const affCore=YongShenCore.affairByName(curAffair);
  if(!affCore)return;
  curCandidates=YongShenCore.candidates(chartC,affCore);
  curJiangZhis=[];
  curCandidates.forEach(c0=>{ if(c0.type==="将")curJiangZhis.push(c0.zhi); });
  // 默认当前用神：若上次选中仍在则沿用，否则取第一个候选
  // （外应取用时 customYongShen=true：保留用户点选的自定义用神，不重置）
  if(!customYongShen && (!curYongshen || !curCandidates.some(c0=>c0.zhi===curYongshen))) curYongshen=curCandidates[0].zhi;
  // 显示候选（可切换），天将用"将·名"标注；六亲与天将重合的加注天将名
  const gold=css("--brand_gold"),cin=css("--brand_cinnabar");
  document.getElementById("lsYongshen").innerHTML=
    `<div class="t">类神候选（点击切换用神 · 金色=当前 · 朱砂=天将类神）</div><div class="pills">`+
    curCandidates.map(c0=>{
      const isJiang=c0.type==="将";
      // 该宫是否同时有天将（用于重合标注）
      const jAt=c0.jiang || (aff.jiang.find(j=>LiurenCore.gongOf(c.jiangMap,j)===c0.zhi)||"");
      return `<span class="ls-pill${c0.zhi===curYongshen?" hl":""}${isJiang||jAt?" jt":""}" onclick="switchYongshen('${c0.zhi}')">${c0.zhi}宫${jAt?"·"+jAt:""}</span>`;
    }).join("")+
    `</div><div class="t" style="margin-top:8px;color:${gold}">取用说明：${aff.note}</div>`;
  renderDongtai();
  // 读象断语（管辂神书组合读象，已抽入核心 YongShenCore.duyuOf）
  const duyu=YongShenCore.duyuOf(curAffair);
  document.getElementById("lsDuyu").innerHTML=
    `<div class="t">读象直断（管辂神书）</div><div class="txt">`+
    duyu.map(d=>`· <b>${d}</b>`).join("<br>")+
    `</div><div class="from">据《大六壬管辂神书》类神取用</div>`;
  renderXiangyi(); // 管辂象意断语（杂占神书歌诀象意库）
  renderPanTai();  // 盘态（月建旺衰·旬空·月将贵人助日·用神状态）
  renderJieDian(); // 用神节点卡（类象词云 + 起爆点）
  renderBifaSection(); // 毕法格局（随用神·动态三传）
  // 盘面高亮（当前用神醒目 + 其它候选弱化）
  highlightLeishen();
  document.getElementById("lsEmpty").style.display="none";
  document.getElementById("lsBody").style.display="block";
}
/* 外应取用：点击盘面任一支 → 自定义为用神（不受占事候选限制；天盘支优先）
   动态三传/毕法/年命行年自动联动（均以 curYongshen 为初传） */
let customYongShen=false;
function pickCustomZhi(z, layer){
  if(!chartC)return;
  curYongshen=z;
  customYongShen=true;
  clearLeishenHighlight();
  if(curAffair){
    // 已选占事：走完整流程（runLeishen 保留自定义用神，不再重置）
    runLeishen();
  }else{
    // 未选占事（纯外应）：显示读象区，渲染动态三传 + 高亮 + 用神提示
    document.getElementById("lsEmpty").style.display="none";
    document.getElementById("lsBody").style.display="block";
    document.getElementById("lsYongshen").innerHTML=
      `<div class="t" style="color:var(--brand_cinnabar)">⚡ 外应取用：${z}（${layer==="天盘"?"天盘加临之象":"地盘本位之象"}）</div>
       <div class="txt" style="margin-top:4px;">以我为太极点取象为用神 · 点盘可换 · 再选「所占之事」可叠加占事断语</div>`;
    renderDongtai();
    highlightLeishen();
    renderBifaSection();
  }
  renderNianming();
}
/* 切换用神：清理旧高亮 → 重新生成动态三传与高亮 */
function switchYongshen(z){
  if(!curCandidates.some(c0=>c0.zhi===z))return;
  curYongshen=z;
  customYongShen=false; /* 切回候选 → 占事驱动 */
  clearLeishenHighlight();
  runLeishen();
}
/* 清掉盘面旧的用神/类将圈与标记（data-ls 标记，保留底盘）*/
function clearLeishenHighlight(){
  const svg=document.getElementById("disk");
  svg.querySelectorAll("[data-ls]").forEach(e=>e.remove());
}
/* 动态三传（以当前用神为初传，传来递生）*/
function renderDongtai(){
  /* 动态三传已抽入核心 YongShenCore.dongtai（与鸿蒙端同构） */
  const items=chartC?YongShenCore.dongtai(chartC,curYongshen):[];
  if(!items.length)return;
  const gz1=items[0].gz, gz2=items[1].gz, gz3=items[2].gz;
  const j1=items[0].jiang, j2=items[1].jiang, j3=items[2].jiang;
  const lq1=items[0].lq, lq2=items[1].lq, lq3=items[2].lq;
  document.getElementById("lsDongtai").innerHTML=
    `<div class="t">动态三传 · 以<b style="color:var(--brand_cinnabar)">${gz1}</b>为用神（传来递生）</div>
     <div class="ls-tri">
       <div class="ls-dt c3">
         <div class="pos">末传 · 事终</div><div class="gz">${gz3}</div>
         <div class="sub">${j3} · ${lq3}</div><span class="up">▲ 终</span>
       </div>
       <div class="ls-dt c2">
         <div class="pos">中传 · 事中</div><div class="gz">${gz2}</div>
         <div class="sub">${j2} · ${lq2}</div><span class="up">▲ 承</span>
       </div>
       <div class="ls-dt c1">
         <div class="pos">初传 · 用神 · 事起</div><div class="gz">${gz1}</div>
         <div class="sub">${j1} · ${lq1}</div><span class="up">▲ 起</span>
       </div>
     </div>`;
}
/* 盘面高亮：当前用神（实心金圈+标记）vs 其它候选（细虚线圈）vs 天将（朱砂圈，按布列宫位）*/
function highlightLeishen(){
  const svg=document.getElementById("disk");
  const gold=css("--brand_gold"),cin=css("--brand_cinnabar");
  // 其它候选：细虚线圈（对象数组取 .zhi）
  curCandidates.forEach(c0=>{
    const z=c0.zhi;
    if(z===curYongshen)return;
    const [x,y]=xy(226,zAngOf(z));
    el("circle",{cx:x,cy:y,r:19,fill:"rgba(168,132,60,.06)",stroke:gold,"stroke-width":1.2,"stroke-dasharray":"4 3",opacity:.55,"data-ls":"1"},svg);
  });
  // 当前用神：实心金圈 + 标记
  const [x,y]=xy(226,zAngOf(curYongshen));
  el("circle",{cx:x,cy:y,r:24,fill:"rgba(168,132,60,.22)",stroke:gold,"stroke-width":3.5,"class":"pulse-ls","data-ls":"1"},svg);
  el("text",{x:x,y:y-32,"text-anchor":"middle",fill:gold,"font-size":11,"font-weight":"700","data-ls":"t"},svg).textContent="用神★";
  // 天将类神：朱砂圈（按布列宫位；若与当前用神或其它候选同宫，则在圈内加"将"字，不叠圈）
  curJiangZhis.forEach(z=>{
    const isCur=z===curYongshen;
    const [jx,jy]=xy(88,zAngOf(z));
    el("circle",{cx:jx,cy:jy,r:18,fill:isCur?"rgba(180,85,45,.18)":"rgba(180,85,45,.1)",stroke:cin,"stroke-width":2.2,"class":"pulse-ls","data-ls":"1"},svg);
    el("text",{x:jx,y:jy+26,"text-anchor":"middle",fill:cin,"font-size":9,"data-ls":"t"},svg).textContent="类将";
  });
}
/* 排盘后未选事类时的引导 */
function showLeishenReady(){
  document.getElementById("lsEmpty").style.display="block";
  document.getElementById("lsBody").style.display="none";
  document.getElementById("lsEmpty").textContent="✅ 盘面已起，点击上方「所占之事」标签 → 自动抓取类神、盘面高亮、生成动态三传与读象断语";
}
document.addEventListener("click",e=>{
  const ls=document.getElementById("lsBody");
  if(ls&&ls.style.display!=="none"){ /* 保持 */ }
});

function drawDisk(c){
  const svg=document.getElementById("disk");svg.innerHTML="";
  const {tp,kegs,dun,sanchuan,jiangMap}=c;
  const gold=css("--brand_gold"),line=css("--divider"),text=css("--text_primary"),t2=css("--text_secondary");
  const cin=css("--brand_cinnabar"),ver=css("--brand_verdigris"),por=css("--brand_porcelain");
  const tl=css("--tian_line"),dbg=css("--disk_bg"),tbg=css("--tian_bg");
  el("circle",{cx:CX,cy:CY,r:246,fill:dbg,stroke:line,"stroke-width":2},svg);
  el("circle",{cx:CX,cy:CY,r:198,fill:"none",stroke:line,"stroke-width":1},svg);
  el("circle",{cx:CX,cy:CY,r:190,fill:"none",stroke:tl,"stroke-width":1.6,"stroke-dasharray":"5 4"},svg);
  el("circle",{cx:CX,cy:CY,r:160,fill:"none",stroke:line,"stroke-width":1},svg);
  el("circle",{cx:CX,cy:CY,r:126,fill:tbg,stroke:tl,"stroke-width":1.2},svg);
  el("circle",{cx:CX,cy:CY,r:118,fill:"none",stroke:line,"stroke-width":1},svg);
  el("circle",{cx:CX,cy:CY,r:58,fill:"none",stroke:line,"stroke-width":1,"stroke-dasharray":"2 3"},svg);
  for(let i=0;i<12;i++){
    const z=ZHI[i],g=el("g",{},svg);
    /* 外圈：天将（接天盘外） */
    const [jx,jy]=xy(178,zAng(i));
    const j=jiangMap[z],jcol=JIANG_JX[j]==="凶"?cin:(JIANG_JX[j]==="吉"?ver:por);
    el("circle",{cx:jx,cy:jy,r:13,fill:"rgba(0,0,0,.08)",stroke:jcol,"stroke-width":1},g);
    el("text",{x:jx,y:jy,"text-anchor":"middle","dominant-baseline":"central",fill:jcol,"font-size":9},g).textContent=j;
    /* 外圈：天盘支（月将加时后的天盘，加临于地盘宫位置） */
    const tz=tp[z]; // 该地盘宫(z)上方的天盘支
    const [tx,ty]=xy(230,zAng(i));
    const tc=el("circle",{cx:tx,cy:ty,r:16,fill:"rgba(0,0,0,.10)",stroke:tl,"stroke-width":1},g);
    tc.style.cursor="pointer"; tc.onclick=(e)=>{e.stopPropagation();pickCustomZhi(tz,"天盘");};
    const tt=el("text",{x:tx,y:ty,"text-anchor":"middle","dominant-baseline":"central",fill:gold,"font-size":18,"font-weight":"700"},g);
    tt.textContent=tz; tt.style.cursor="pointer"; tt.onclick=(e)=>{e.stopPropagation();pickCustomZhi(tz,"天盘");};
    el("text",{x:tx,y:ty+21,"text-anchor":"middle","dominant-baseline":"central",fill:gold,"font-size":8,"opacity":.8},g).textContent=dun[tz];
    /* 中圈：遁干（地盘干；zhMode: 旬/日遁/时遁） */
    const [gx,gy]=xy(144,zAng(i));
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
    }
    /* 内圈：地盘十二支（固定） */
    const [ex,ey]=xy(108,zAng(i));
    const ec=el("circle",{cx:ex,cy:ey,r:12,fill:"rgba(0,0,0,.06)",stroke:line,"stroke-width":1},g);
    ec.style.cursor="pointer"; ec.onclick=(e)=>{e.stopPropagation();pickCustomZhi(z,"地盘");};
    const et=el("text",{x:ex,y:ey,"text-anchor":"middle","dominant-baseline":"central",fill:text,"font-size":17,"font-weight":"600"},g);
    et.textContent=z; et.style.cursor="pointer"; et.onclick=(e)=>{e.stopPropagation();pickCustomZhi(z,"地盘");};
  }
  const marks=sanchuan.chuans.map((ch,i)=>({z:ch.z,label:["初","中","末"][i]+"·"+ch.gz,color:[cin,ver,por][i]}));
  marks.forEach(m=>{
    const [x,y]=xy(246,zAngOf(m.z));
    el("circle",{cx:x,cy:y,r:13,fill:"none",stroke:m.color,"stroke-width":2.5},svg);
    el("text",{x:x,y:y+30,"text-anchor":"middle",fill:m.color,"font-size":11,"font-weight":"600"},svg).textContent=m.label;
  });
  el("text",{x:CX,y:CY-6,"text-anchor":"middle","dominant-baseline":"central",fill:gold,"font-size":15,"font-weight":"700"},svg).textContent=c.r.dg+c.r.dz+"日";
  el("text",{x:CX,y:CY+16,"text-anchor":"middle",fill:t2,"font-size":10},svg).textContent=`月将${c.yj.zhi}加${selHour}时`;
}

/* ===== 模式/风格 ===== */
let chartBuilt=false; // 是否已出盘
function redrawChart(){
  // 已出盘时按当前主题静默重绘（不重复动画）
  if(!chartBuilt)return;
  const c=buildChart(); if(!c)return;
  chartC=c;
  renderSizhu(c); drawDisk(c); renderKeg(c); renderChuan(c);
  if(curAffair) runLeishen(); else showLeishenReady();
}
document.getElementById("modeBtn").addEventListener("click",()=>{
  const dark=document.body.dataset.theme==="dark";
  document.body.dataset.theme=dark?"light":"dark";
  document.getElementById("modeBtn").textContent=dark?"🌙 深色":"☀ 浅色";
  redrawChart();
});
document.getElementById("styleSeg").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b)return;
  document.querySelectorAll("#styleSeg button").forEach(x=>x.style.background="transparent");
  document.querySelectorAll("#styleSeg button").forEach(x=>x.style.color="");
  b.style.background="linear-gradient(135deg,var(--brand_gold),var(--brand_cinnabar))";
  b.style.color="#fff"; b.style.fontWeight="600";
  document.body.dataset.style=b.dataset.v;
  redrawChart();
});

/* 初始化：万年历+时辰，右侧占位 */
document.querySelector('#styleSeg button[data-v="A"]').style.background="linear-gradient(135deg,var(--brand_gold),var(--brand_cinnabar))";
document.querySelector('#styleSeg button[data-v="A"]').style.color="#fff";
document.querySelector('#styleSeg button[data-v="A"]').style.fontWeight="600";
document.getElementById("sizhu").innerHTML='<div class="gz-pill" style="flex:1;text-align:center;color:var(--text_secondary);font-size:var(--fs_caption_l);padding:16px 0;">请选择日期与时辰后点击「排盘」</div>';
document.getElementById("calInfo").textContent="未起课";
document.getElementById("kegGrid").innerHTML='<div style="grid-column:1/-1;text-align:center;color:var(--text_secondary);padding:24px 0;font-size:var(--fs_caption_l);">点击「排盘」后显示四课</div>';
document.getElementById("zongmen").textContent="等待起课";
document.getElementById("chuanRow").innerHTML='<div style="grid-column:1/-1;text-align:center;color:var(--text_secondary);padding:24px 0;font-size:var(--fs_caption_l);">点击「排盘」后显示三传</div>';
renderShichen();
renderAffairChips(); // 抓用神：渲染"所占之事"标签
document.getElementById("ymTitle").onclick=jumpYear; // 年份标题点击 → 输入跳转
renderCal(); // 触发 2026 数据加载，加载完成自动重绘

