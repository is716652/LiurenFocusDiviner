/* ============================================================================
 * _ets_pipeline.js —— ArkTS 侧组件化重建【唯一入口】
 * ----------------------------------------------------------------------------
 * 按固定顺序跑完整条链（任一步失败即停）：
 *   1) _tools/_extras.js   从 core/liuren/pan/dx.ts 抽 palaceLookup → _ets_extras_dx.txt
 *   2) _tools/_etsgen.js   按「成员→模块」显式映射从基线单体切出各模块 + 生成门面
 *   3) _tools/_o1.js       归属限定符改写（LiurenCore.X → LrX.X，与 .ts 侧同口径）
 *   4) sync_free_edition.py + verify_free_edition.py（免费版同步与校验）
 * 之后接主版构建（工作目录 APP/LiurenFocusDiviner）：
 *   D:\HarmonyOS\command-line-tools-6.1.1-release\bin\hvigorw.bat assembleHap \
 *     --mode module -p product=default --no-daemon
 *
 * 生成物（model/pan/*.ets、model/{bifa,zhonghuang,LiurenCore}.ets）勿手改；
 * 改实现请改 core/liuren/**（真源），两侧分别由本脚本与 _tools/build_core.js 重建。
 * 用法：node _tools/_ets_pipeline.js
 * ==========================================================================*/
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
function run(label, cmd, args) {
  process.stdout.write('\n== ' + label + ' ==\n');
  execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
}
run('1/4 抽取新增只读接口', process.execPath, [path.join(__dirname, '_extras.js')]);
run('2/4 切片生成 .ets 模块与门面', process.execPath, [path.join(__dirname, '_etsgen.js')]);
run('3/4 归属限定符改写', process.execPath, [path.join(__dirname, '_o1.js')]);
run('4/4 免费版同步', 'python', [path.join(__dirname, 'sync_free_edition.py')]);
run('4/4 免费版校验', 'python', [path.join(__dirname, 'verify_free_edition.py')]);
console.log('\nArkTS 侧重建完成。请接主版构建：');
console.log('  cd APP/LiurenFocusDiviner && D:\\HarmonyOS\\command-line-tools-6.1.1-release\\bin\\hvigorw.bat assembleHap --mode module -p product=default --no-daemon');
