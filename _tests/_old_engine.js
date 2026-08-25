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
function wutun(g){return {甲:"甲",己:"甲",乙:"丙",庚:"丙",丙:"戊",辛:"戊",丁:"庚",壬:"庚",戊:"壬",癸:"壬"}[g];}
function hourGan(dg,hz){return GAN[(GAN.indexOf(wutun(dg))+ZHI.indexOf(hz))%10];}
function wxOf(x){return WX[x]||WXG[x];}
function ke(a,b){return KE[wxOf(a)]===wxOf(b);}
function dunMap(dg){ // 五子元遁
  const zi=wutun(dg), ziIdx=GAN.indexOf(zi);
  const m={}; ZHI.forEach((z,i)=>m[z]=GAN[(ziIdx+i)%10]);
  return m;
}
function findYuejiang(dateStr,hourZhi){
  // 用时辰中点时刻判断（精确月将，全量 1900~2060）
  const mid={子:"00:00",丑:"02:00",寅:"04:00",卯:"06:00",辰:"08:00",巳:"10:00",午:"12:00",未:"14:00",申:"16:00",酉:"18:00",戌:"20:00",亥:"22:00"}[hourZhi];
  const ts=dateStr+" "+mid+":00";
  if(window.YJ_ALL){
    for(const s of window.YJ_ALL){ if(ts>=s.st&&ts<s.en) return {jiang:s.j,zhi:s.z,term:s.t}; }
    const last=window.YJ_ALL[window.YJ_ALL.length-1];
    return ts>=last.st?{jiang:last.j,zhi:last.z,term:last.t}:{jiang:"神后",zhi:"子",term:"大寒"};
  }
  // 兜底：按中气直查（近似）
  const ZQ={1:["神后","子"],2:["登明","亥"],3:["河魁","戌"],4:["从魁","酉"],5:["传送","申"],6:["小吉","未"],7:["胜光","午"],8:["太乙","巳"],9:["天罡","辰"],10:["太冲","卯"],11:["功曹","寅"],12:["大吉","丑"]};
  const m=parseInt(dateStr.slice(5,7));
  return {jiang:ZQ[m][0],zhi:ZQ[m][1],term:""};
}
function buildChart(){
  const r=dayRec(selDate);
  if(!r)return null;
  // 月将（精确）
  const yj=findYuejiang(selDate,selHour);
  // 天盘：月将加占时
  const mj=ZHI.indexOf(yj.zhi), zs=ZHI.indexOf(selHour);
  const tp={}; ZHI.forEach((z,i)=>tp[z]=ZHI[(mj+(i-zs)+12)%12]);
  // 四课
  const g1=tp[JI_GONG[r.dg]], g2=tp[g1], g3=tp[r.dz], g4=tp[g3];
  const kegs=[{x:g1,s:r.dg},{x:g2,s:g1},{x:g3,s:r.dz},{x:g4,s:g3}];
  // 遁干
  const dun=dunMap(r.dg);
  // 三传九宗门
  const sanchuan=resolveSanchuan(r.dg,tp,kegs,dun);
  // 天将：贵加占时（昼=卯-申 index3-8，夜=酉-寅 index9-11,0-2）
  const night = !(ZHI.indexOf(selHour)>=3 && ZHI.indexOf(selHour)<=8);
  const gui = night?GUIREN[r.dg][1]:GUIREN[r.dg][0];
  const guiGong = selHour; // 贵人加占时
  const shun = [0,1,2,3,4,5].includes(ZHI.indexOf(guiGong)); // 亥-辰顺
  const order = shun?JIANG_SHUN:JIANG_NI;
  const jiangMap={};
  for(let k=0;k<12;k++){
    const g=shun?ZHI[(ZHI.indexOf(guiGong)+k)%12]:ZHI[(ZHI.indexOf(guiGong)-k+12)%12];
    jiangMap[g]=order[k];
  }
  const c0={r,yj,tp,kegs,dun,sanchuan,jiangMap,gui,shun,night,hourGan:hourGan(r.dg,selHour)};
  c0.dx=computeDuxiang(c0); // 盘态：旬空/旺衰/气机点/冲合刑害/月将贵人助日
  return c0;
}
/* ============ 盘态计算（读象地基：旬空/旺衰/气机点/冲合刑害/月将·贵人助日）============ */
const WANG_T=()=>((window.DUXIANG_RULES&&window.DUXIANG_RULES["旺衰休囚死"])||{}).旺衰||{};
const XUN_KONG=(()=>{ // 日柱干支 -> 旬空二支
  const m={}, t=[["甲子","戌亥"],["甲戌","申酉"],["甲申","午未"],["甲午","辰巳"],["甲辰","寅卯"],["甲寅","子丑"]];
  t.forEach(([jia,kk])=>{
    const j=GAN.indexOf(jia[0]), z=ZHI.indexOf(jia[1]);
    for(let i=0;i<10;i++) m[GAN[(j+i)%10]+ZHI[(z+i)%12]]=kk.split("");
  });
  return m;
})();
const YUE_LING=(()=>{ // 月支 -> 五行旺相休囚死（地支旺衰：旺=当令 相=令生 休=生令 囚=克令 死=被令克）
  const m={};
  ZHI.forEach(z=>{
    const ling=WX[z], st={};
    ["木","火","土","金","水"].forEach(w=>{
      if(w===ling)st[w]="旺";
      else if(SHENG(ling)===w)st[w]="相";
      else if(SHENG(w)===ling)st[w]="休";
      else if(KE[w]===ling)st[w]="囚";
      else st[w]="死";
    });
    m[z]=st;
  });
  return m;
})();
const QIJI_GONG=(()=>{ // 日干 -> {地支:十二宫气机点}（阳顺阴逆）
  const gongs=["长生","沐浴","冠带","临官","帝旺","衰","病","死","墓","绝","胎","养"];
  const yangS={甲:"亥",丙:"寅",戊:"寅",庚:"巳",壬:"申"}, yinS={乙:"午",丁:"酉",己:"酉",辛:"子",癸:"卯"};
  const m={};
  ["甲","丙","戊","庚","壬"].forEach(g=>{const o={},s=ZHI.indexOf(yangS[g]);gongs.forEach((n,i)=>o[ZHI[(s+i)%12]]=n);m[g]=o;});
  ["乙","丁","己","辛","癸"].forEach(g=>{const o={},s=ZHI.indexOf(yinS[g]);gongs.forEach((n,i)=>o[ZHI[(s-i+12)%12]]=n);m[g]=o;});
  return m;
})();
const XUN_OF=(()=>{ // 日柱干支 -> 旬首（甲子/甲戌/…）
  const m={}, t=["甲子","甲戌","甲申","甲午","甲辰","甲寅"];
  t.forEach(jia=>{const j=GAN.indexOf(jia[0]),z=ZHI.indexOf(jia[1]);for(let i=0;i<10;i++)m[GAN[(j+i)%10]+ZHI[(z+i)%12]]=jia;});
  return m;
})();
function computeShensha(c){ // 神煞起法（35神煞，查表自 神煞起法.json）
  const S=(window.SHENSHA_RULES&&window.SHENSHA_RULES["神煞"])||{};
  const r=c.r;
  const yz=typeof r.ygc==="string"?r.ygc.slice(1):((r.ygc&&r.ygc.z)||""); // 年支
  const mz=r.mz, dg=r.dg, dz=r.dz, xun=XUN_OF[dg+dz]||"";
  const byZhi={}; ZHI.forEach(z=>byZhi[z]=[]);
  const list=[];
  for(const nm in S){
    const s=S[nm]; let v=null;
    const b=s["基准"]||"";
    if(b==="年支"){v=s["表"][yz];}
    else if(b==="月支"){ // 月煞表键=月份1..12（寅月=1），季煞表键=月支
      const mNo=(ZHI.indexOf(mz)-ZHI.indexOf("寅")+12)%12+1;
      v=(s["表"][String(mNo)]!==undefined)?s["表"][String(mNo)]:s["表"][mz];
    }
    else if(b==="日干"){v=s["表"][dg];}
    else if(b==="日支"){v=s["表"][dz];}
    else if(b==="旬"){v=s["表"][xun];}
    if(v==null||v==="")continue;
    const zhis=String(v).split(""); // 表值均为地支单字（旬空如"子丑"拆为两字）
    zhis.forEach(z=>{ if(byZhi[z])byZhi[z].push(nm); });
    list.push({name:nm,zhi:zhis.join(""),ji:s["吉凶"]||"",conf:s["置信度"]||""});
  }
  return {byZhi,list};
}
function bifaForChuans(c, chu){ // 毕法赋格局识别（18 可判定格局；chu=三传数组[{z}]，可传本课或动态三传）
  const B=window.BIFA&&window.BIFA["一百法"]||[];
  const r=c.r, dx=c.dx, kegs=c.kegs;
  const c1=chu[0].z,c2=chu[1].z,c3=chu[2].z;
  const ji=JI_GONG[r.dg];
  const RILU={甲:"寅",乙:"卯",丙:"巳",丁:"午",戊:"巳",己:"午",庚:"申",辛:"酉",壬:"亥",癸:"子"};
  const xun=XUN_OF[r.dg+r.dz]||"", xunWei=ZHI[(ZHI.indexOf(xun.slice(1))+9)%12];
  const guiZhi=c.gui, night=c.night;
  const yang=z=>!!YANG_ZHI[z];
  const liuqinOf=z=>{const w=WX[z],dw=WXG[r.dg];if(w===dw)return"兄弟";if(KE[dw]===w)return"妻财";if(KE[w]===dw)return"官鬼";if(SHENG(dw)===w)return"子孙";return"父母";};
  const keZ=(a,b)=>KE[WX[a]]===WX[b];
  const out=[];
  const hit=(no,note)=>{const f=B.find(x=>x["序"]===no); if(f)out.push({序:no,法名:f["法名"],赋文:(f["赋文"]||"").replace(/。$/,""),判:note});};
  if(c1===ZHI[(ZHI.indexOf(ji)+1)%12]&&c3===ZHI[(ZHI.indexOf(ji)-1+12)%12])hit(1,"初引末从");
  if(kegs[0].x===xunWei&&kegs[2].x===xun.slice(1))hit(2,"干上旬尾·支上旬首");
  if((night&&guiZhi===GUIREN[r.dg][0])||(!night&&guiZhi===GUIREN[r.dg][1])){ if(gongOf(c.jiangMap,"贵人")===ji)hit(3,"帘幕贵人临干"); }
  const all=[ji,r.dz,kegs[0].x,kegs[1].x,kegs[2].x,kegs[3].x,c1,c2,c3];
  if(all.every(z=>yang(z)))hit(5,"干支课传皆阳");
  if(all.every(z=>!yang(z)))hit(6,"干支课传皆阴");
  if(kegs[0].x===RILU[r.dg]&&(dx.dayWangShuai==="旺"||dx.dayWangShuai==="相"))hit(7,"干上禄旺");
  if(kegs[2].x===RILU[r.dg])hit(8,"日禄临支");
  const fwd=c2===ZHI[(ZHI.indexOf(c1)+1)%12]&&c3===ZHI[(ZHI.indexOf(c2)+1)%12];
  const bwd=c2===ZHI[(ZHI.indexOf(c1)-1+12)%12]&&c3===ZHI[(ZHI.indexOf(c2)-1+12)%12];
  const chKong=chu.some(x=>dx.xunkong.includes(x.z));
  if(fwd&&chKong)hit(17,"顺连茹逢空");
  if(bwd&&chKong)hit(18,"逆连茹逢空");
  const lq=chu.map(x=>liuqinOf(x.z));
  if(lq.every(x=>x==="妻财")&&liuqinOf(kegs[0].x)==="官鬼")hit(27,"三传皆财·干上鬼");
  if(lq.every(x=>x==="官鬼")&&liuqinOf(kegs[0].x)==="妻财")hit(28,"三传皆鬼·干上财");
  if(keZ(c1,c2)&&keZ(c2,c3)&&keZ(c1,c3))hit(32,"三传递相克");
  if(c1===xunWei)hit(38,"旬尾发用(闭口)");
  const zhiMa={申:"寅",子:"寅",辰:"寅",亥:"巳",卯:"巳",未:"巳",寅:"申",午:"申",戌:"申",巳:"亥",酉:"亥",丑:"亥"}[r.dz];
  if(kegs[0].x===zhiMa&&kegs[2].x===RILU[r.dg])hit(41,"干支互换禄马");
  const zhiMu={申:"辰",子:"辰",辰:"辰",亥:"未",卯:"未",未:"未",寅:"戌",午:"戌",戌:"戌",巳:"丑",酉:"丑",丑:"丑"}[r.dz];
  if(kegs[2].x===zhiMu&&c.yj.zhi===zhiMu)hit(60,"支墓临支且为月将");
  const ganMu={甲:"未",乙:"未",丙:"戌",丁:"戌",戊:"戌",己:"戌",庚:"丑",辛:"丑",壬:"辰",癸:"辰"}[r.dg];
  if(kegs[0].x===ganMu&&c.jiangMap[gongOf(c.tp,kegs[0].x)]==="白虎")hit(61,"干上墓乘白虎");
  const huZhi=gongOf(c.jiangMap,"白虎"), huDun=c.dun[huZhi]||"";
  if(huDun&&KE[WXG[huDun]]===WXG[r.dg])hit(69,"白虎乘"+huDun+"遁鬼");
  if(liuqinOf(kegs[2].x)==="官鬼"||liuqinOf(kegs[3].x)==="官鬼")hit(70,"官鬼临三四课");
  return out;
}
function checkBifa(c){ return bifaForChuans(c, c.sanchuan.chuans); } // 本课格局（静态）
function computeDuxiang(c){
  const R=window.DUXIANG_RULES||{}, r=c.r, gx=R["基础关系"]||{};
  const kx=(XUN_KONG[r.dg+r.dz]||[]), yz=r.mz;
  const dwW=(WANG_T()[r.dg]||{})[yz]||"";
  const qj=QIJI_GONG[r.dg]||{};
  const nodes={};
  ZHI.forEach(z=>{
    nodes[z]={wangShuai:(YUE_LING[yz]||{})[WX[z]]||"", qiJi:qj[z]||"", kong:kx.includes(z)};
  });
  // 月将助日
  const yjZ=c.yj.zhi, yjGong=gongOf(c.tp,yjZ), yjWx=WX[yjZ], dgWx=WXG[r.dg];
  const yj={zhi:yjZ,gong:yjGong,kong:kx.includes(yjZ),wangShuai:nodes[yjZ].wangShuai,
    linGan:(yjGong===JI_GONG[r.dg]),shengGan:(SHENG(yjWx)===dgWx),keGan:(KE[yjWx]===dgWx),
    faYong:(c.sanchuan.chuans[0].z===yjZ)};
  yj.zhu=(yj.linGan||yj.shengGan||yj.faYong||yj.wangShuai==="旺"||yj.wangShuai==="相")&&!(yj.keGan||yj.kong);
  // 贵人助日（贵人布列宫位；防御：布列异常时降级为空状态）
  const guiGong=gongOf(c.jiangMap,"贵人");
  const guiNd=ZHI.includes(guiGong)?(nodes[guiGong]||{}):{};
  const guiWx=WX[guiGong]||"";
  const gr={zhi:guiGong,kong:!!guiNd.kong,wangShuai:guiNd.wangShuai||"",
    linGan:(guiGong===JI_GONG[r.dg]),shengGan:!!(guiWx&&SHENG(guiWx)===dgWx),keGan:!!(guiWx&&KE[guiWx]===dgWx),
    faYong:(c.sanchuan.chuans[0].z===guiGong)};
  gr.zhu=(gr.linGan||gr.shengGan||gr.faYong||gr.wangShuai==="旺"||gr.wangShuai==="相")&&!(gr.keGan||gr.kong||gr.wangShuai==="死"||gr.wangShuai==="囚");
  // 关系：12支 冲/合/害/刑
  const relations={};
  ZHI.forEach(z=>{
    relations[z]={chong:(gx["六冲"]||{})[z]||null, he:(gx["六合"]||{})[z]||null, hai:(gx["六害"]||{})[z]||null, xing:(gx["三刑"]||{})[z]||[]};
  });
  const dx={xunkong:kx,monthZhi:yz,dayWangShuai:dwW,nodes,relations,yuejiang:yj,guiren:gr,shensha:computeShensha(c)};
  dx.bifa=checkBifa(Object.assign({},c,{dx})); // 本课格局（静态，供参考）
  return dx;
}
/* 毕法格局·定位渲染：对每个命中格局确定焦点支，填入 定性/定象/定时/定策/定级；chu 可传本课或动态三传；aff 为当前占事（用于适用过滤） */
function renderBifaForChuans(c,dx,chu,aff){
  const B=window.BIFA&&window.BIFA["一百法"]||[];
  const r=c.r, kegs=c.kegs;
  const kong=z=>dx.xunkong.includes(z);
  const jiangOf=z=>c.jiangMap[gongOf(c.tp,z)]||"";
  const wsMap={旺:"旺相",相:"旺相",休:"休囚",囚:"休囚",死:"衰死"};
  const zhiMa={申:"寅",子:"寅",辰:"寅",亥:"巳",卯:"巳",未:"巳",寅:"申",午:"申",戌:"申",巳:"亥",酉:"亥",丑:"亥"}[r.dz];
  const dingMa=(()=>{for(const z in dx.shensha.byZhi){if(dx.shensha.byZhi[z].includes("旬丁(丁马)"))return z;}return "";})();
  const liuqinOf=z=>{const w=WX[z],dw=WXG[r.dg];if(w===dw)return"兄弟";if(KE[dw]===w)return"妻财";if(KE[w]===dw)return"官鬼";if(SHENG(dw)===w)return"子孙";return"父母";};
  const out=[];
  (bifaForChuans(Object.assign({},c,{dx}),chu)||[]).forEach(hit=>{ // 用传入的三传（本课/动态）重新判定格局
    const f=B.find(x=>x["序"]===hit["序"]); if(!f)return;
    const loc=(f["判定"]&&f["判定"]["定位"])||{};
    // 焦点支：各格局取关键盘位
    let fz="";
    const no=hit["序"];
    if(no===1)fz=chu[0].z;
    else if(no===2)fz=kegs[0].x;
    else if(no===3)fz=gongOf(c.jiangMap,"贵人");
    else if(no===5||no===6||no===32||no===38)fz=chu[0].z;
    else if(no===7||no===27||no===28||no===41||no===61)fz=kegs[0].x;
    else if(no===8||no===60)fz=kegs[2].x;
    else if(no===17||no===18)fz=chu.find(x=>kong(x.z))?chu.find(x=>kong(x.z)).z:"";
    else if(no===69)fz=gongOf(c.jiangMap,"白虎");
    else if(no===70)fz=(liuqinOf(kegs[2].x)==="官鬼")?kegs[2].x:kegs[3].x;
    const nd=dx.nodes[fz]||{};
    const rep={"{支}":fz||"—","{乘将}":fz?jiangOf(fz):"—","{月建}":dx.monthZhi,"{太岁}":(typeof r.ygc==="string"?r.ygc.slice(1):(r.ygc&&r.ygc.z)||""),"{初传}":chu[0]?chu[0].z:"","{中传}":chu[1]?chu[1].z:"","{末传}":chu[2]?chu[2].z:"","{丁马}":dingMa||"—"};
    const fill=t=>{ // 值占位符填充 + 裸词条件分支评估（按 ；。 分段，若…命中才显示）
      if(!t)return"";
      const jz=fz?jiangOf(fz):"", isKong=kong(fz), ws=wsMap[nd.wangShuai]||"";
      const yz2=(typeof r.ygc==="string"?r.ygc.slice(1):(r.ygc&&r.ygc.z))||"";
      const segs=String(t).match(/[^；。]*[；。]/g)||[String(t)], out=[];
      segs.forEach(seg=>{
        const sep=seg.slice(-1); const c=seg.slice(0,-1).trim(); if(!c)return;
        let kept=true, rest=c;
        const m1=c.match(/^若乘将为(.+?)，/);
        if(m1){const wants=m1[1].split(/[或、/]/).map(s=>s.trim()).filter(Boolean);kept=wants.some(w=>jz.includes(w));rest=c.slice(m1[0].length);}
        else{
          const m2=c.match(/^若(逢空|未空)，/);
          if(m2){kept=(m2[1]==="逢空")===isKong;rest=c.slice(m2[0].length);}
          else{
            const m3=c.match(/^若(旺相|休囚|衰死)(?:或(旺相|休囚|衰死))*，/);
            if(m3){const vals=[m3[1],m3[2]].filter(Boolean);kept=vals.includes(ws);rest=c.slice(m3[0].length);}
            else{
              const m4=c.match(/^若临(月建|太岁)，/);
              if(m4){const ref=m4[1]==="月建"?dx.monthZhi:yz2;kept=fz===ref;rest=c.slice(m4[0].length);}
              else{
                const m5=c.match(/^若逢丁马，/);
                if(m5){kept=!!dingMa&&fz===dingMa;rest=c.slice(m5[0].length);}
              }
            }
          }
        }
        if(kept&&rest)out.push(rest.replace(/\{支\}|\{乘将\}|\{月建\}|\{太岁\}|\{初传\}|\{中传\}|\{末传\}|\{丁马\}/g,mm=>rep[mm])+sep);
      });
      return out.join("");
    };
    const layer={};
    ["定性","定象","定时","定策","定级"].forEach(k=>layer[k]=fill(loc[k])||"");
    const apply=((f["判定"]&&f["判定"]["适用占事"])||[]);
    const relevant=!apply.length||apply.includes(aff);
    out.push({序:no,法名:f["法名"],赋文:(f["赋文"]||"").replace(/。$/,""),判:hit["判"],焦点:fz,layer,相关:relevant,适用:apply});
  });
  return out;
}
function renderBifa(c,dx){ return renderBifaForChuans(c,dx,c.sanchuan.chuans,curAffair); }
function resolveSanchuan(dg,tp,kegs,dun){
  const yangGan=!!G_YANG[dg];
  // 贼克
  const down=[],up=[];
  kegs.forEach((k,i)=>{ if(ke(k.s,k.x))down.push(i); else if(ke(k.x,k.s))up.push(i); });
  let method, chuan1;
  if(down.length===1&&up.length===0){method="重审";chuan1=kegs[down[0]].x;}
  else if(down.length===0&&up.length===1){method="元首";chuan1=kegs[up[0]].x;}
  else if(down.length+up.length>=2){
    // 比用
    const ks=down.length>0?down:up;
    const bi=ks.filter(i=>!!YANG_ZHI[kegs[i].x]===yangGan);
    if(bi.length===1){method="比用";chuan1=kegs[bi[0]].x;}
    else if(bi.length>1){
      // 涉害：顺数至本家计克数
      method="涉害";
      let best=-1,bestK=null;
      bi.forEach(i=>{
        const shang=kegs[i].x, xia=kegs[i].s;
        let cnt=0, cur=ZHI.indexOf(xia);
        while(ZHI[cur]!==shang){ if(ke(ZHI[cur],shang))cnt++; cur=(cur+1)%12; }
        if(cnt>best){best=cnt;bestK=shang;}
      });
      chuan1=bestK;
    } else { method="涉害"; chuan1=kegs[ks[0]].x; }
  } else {
    // 遥克
    const haoshi=[],danshe=[];
    kegs.forEach((k,i)=>{ if(i>0&&ke(k.x,dg))haoshi.push(i); if(i>0&&ke(dg,k.x))danshe.push(i); });
    if(haoshi.length>0){
      method="遥克·蒿矢";
      const pick=haoshi.filter(i=>!!YANG_ZHI[kegs[i].x]===yangGan);
      chuan1=kegs[(pick.length?pick[0]:haoshi[0])].x;
    } else if(danshe.length>0){
      method="遥克·弹射";
      chuan1=kegs[danshe[0]].x;
    } else {
      // 昴星
      method="昴星";
      if(yangGan){ chuan1=tp["酉"]; }
      else { chuan1=ZHI[(ZHI.indexOf("酉")-3+12)%12]; }
    }
  }
  // 中末传
  let chuan2,chuan3;
  if(method==="昴星"){
    chuan2=yangGan?tp[kegs[2].s]:tp[JI_GONG[dg]];
    chuan3=yangGan?tp[JI_GONG[dg]]:tp[kegs[2].s];
  } else {
    chuan2=tp[chuan1]; chuan3=tp[chuan2];
  }
  return {method,chuans:[chuan1,chuan2,chuan3].map(z=>({z,gz:dun[z]+z}))};
}
function SHENG(a){return {木:"火",火:"土",土:"金",金:"水",水:"木"}[a];}

function gongOf(tp,z){for(const k in tp)if(tp[k]===z)return k;return z;}

var selDate = "", selHour = "", curAffair = "求财";
function oldBuildChart(date, hourZhi) { selDate = date; selHour = hourZhi; return buildChart(); }
