/* ============================================================================
 * prop_trace.js —— 追溯"父级传给组件的颜色 prop"到底传了什么表达式
 * ----------------------------------------------------------------------------
 * 为什么需要：对比度门禁原先只解析 字面量 / $r() 令牌 / 帮助函数 return / 本文件变量，
 *   所以**跨文件传进来的 prop 值它看不见**。2026-09-18"初传干支看不清"正是这样漏掉的：
 *   Index.ets 里 `chuanRows()` 算出 color 字段 → 作为 `color` prop 传给 ChuanCard。
 * 分层能力（深度有限，宁可漏报不误报）：
 *   L1 `$r('app.color.X')` / `'#RRGGBB'` / `rgba(...)`     —— 直接可取
 *   L2 三元等表达式                                        —— 取两支并集（保守）
 *   L3 `this.fn(...)`                                      —— 取该函数所有 return 值
 *   L4 `this.fn()[i].field`                                —— 进 fn 体内找 `field:` 赋值；
 *                                                            值若是裸标识符，再解一层同名 const
 *   L4b `this.fn()[i].field.sub`（2026-09-19 补）           —— `field` 的值是对象字面量（或裸标识符
 *                                                            绑定的对象字面量）时，取其中 `sub:` 的值
 * 解析不到的一律返回给调用方 —— 调用方（对比度门禁）会打印出来，**并判否**（2026-09-19 起，
 * 留成提示的话，写法深一层就会静默失去覆盖而报告照样 PASS）。
 * 本模块只做**定位**，不解析颜色：颜色提取交给调用方（它才知道令牌表与主题）。
 * ==========================================================================*/
'use strict';

/** 找出所有 `name({ ... })` 的实参文本（花括号配平） */
function callArgs(text, name) {
  const out = [];
  const re = new RegExp('\\b' + name + '\\s*\\(\\s*\\{', 'g');
  let m;
  while ((m = re.exec(text)) !== null) {
    const open = text.indexOf('{', m.index);
    if (open < 0) break;
    let depth = 0;
    for (let i = open; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) { out.push(text.slice(open + 1, i)); break; }
      }
    }
    re.lastIndex = open + 1;
  }
  return out;
}

/** 从实参文本里取 `propName: <expr>`（到逗号或换行结束） */
function argFor(argsText, propName) {
  const re = new RegExp('(^|[\\s{,])' + propName + '\\s*:\\s*([^,\\n]+)');
  const m = argsText.match(re);
  return m ? m[2].trim() : null;
}

/** 取函数体文本（按 `name(...)` 定位，花括号配平） */
function bodyOf(text, fnName) {
  const re = new RegExp('\\b' + fnName + '\\s*\\([^)]*\\)\\s*(?::\\s*[^{]+)?\\{');
  const m = re.exec(text);
  if (!m) return '';
  const open = text.indexOf('{', m.index);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return text.slice(open, i); }
  }
  return '';
}

/** 在函数体里找 `field:` 的值表达式；值若是裸标识符，再解一层同名 const/let */
function fieldValues(fileText, fnName, field) {
  const body = bodyOf(fileText, fnName);
  if (!body) return [];
  const out = [];
  const re = new RegExp('(^|[\\s{])' + field + '\\s*:\\s*([^,\\n}]+)', 'g');
  let m;
  while ((m = re.exec(body)) !== null) {
    const v = m[2].trim();
    if (/^[A-Za-z_$][\w$]*$/.test(v)) {
      const decl = body.match(new RegExp('(?:const|let|var)\\s+' + v + '\\s*(?::[^=]+)?=\\s*([^;\\n]+)'));
      if (decl) out.push(decl[1].trim());
    } else out.push(v);
  }
  return out;
}

/** 组件名（`export struct X`） */
function componentNameOf(text) {
  const m = text.match(/export\s+struct\s+([A-Za-z_$][\w$]*)/);
  return m ? m[1] : '';
}

/** 取 `{ ... }` 区间（从 open 位置起，花括号配平）；返回 [内容, 结束位置] */
function braceBody(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return [text.slice(open + 1, i), i]; }
  }
  return ['', -1];
}

/** 在 scope 里找 `sub: <expr>`；裸标识符再解一层同名 const/let/var ——
 *  声明在 `declScope`（= 整个函数体）里找：真实写法 `deep: { color: color }` 的 const 在对象字面量之外 */
function subValuesIn(scope, sub, declScope) {
  const out = [];
  const re = new RegExp('(^|[\\s{,])' + sub + '\\s*:\\s*([^,\\n}]+)', 'g');
  let m;
  while ((m = re.exec(scope)) !== null) {
    const v = m[2].trim();
    if (/^[A-Za-z_$][\w$]*$/.test(v)) {
      const decl = (declScope || scope).match(new RegExp('(?:const|let|var)\\s+' + v + '\\s*(?::[^=]+)?=\\s*([^;\\n]+)'));
      if (decl) out.push(decl[1].trim());
    } else out.push(v);
  }
  return out;
}

/** L4b：`this.fn()[i].field.sub` —— 取 `field` 对象字面量（或裸标识符绑定的对象字面量）里的 `sub` 值 */
function fieldSubValues(fileText, fnName, field, sub) {
  const body = bodyOf(fileText, fnName);
  if (!body) return [];
  const out = [];
  const re = new RegExp('(^|[\\s{])' + field + '\\s*:\\s*(\\{|[A-Za-z_$][\\w$]*)', 'g');
  let m;
  while ((m = re.exec(body)) !== null) {
    let scope = '';
    if (m[2] === '{') {
      /* 形态 A：同行对象字面量 `field: { sub: ... }` */
      scope = braceBody(body, body.indexOf('{', m.index))[0];
    } else {
      /* 形态 B：`field: ident` → 找 ident 绑定的对象字面量 */
      const decl = body.match(new RegExp('(?:const|let|var)\\s+' + m[2] + '\\s*(?::[^=]+)?=\\s*\\{'));
      if (decl) scope = braceBody(body, body.indexOf('{', decl.index))[0];
    }
    if (scope) out.push(...subValuesIn(scope, sub, body));
    re.lastIndex = m.index + 1;
  }
  return out;
}

/**
 * 主入口：找出该组件该 prop 在所有调用点被传入的表达式
 * @param {object} o { files:[{rel,text}], selfRel, componentName, propName }
 * @returns {Array<{expr:string, fileRel:string}>}
 */
function propExprs(o) {
  const out = [];
  for (const f of o.files) {
    if (f.rel === o.selfRel) continue;
    for (const args of callArgs(f.text, o.componentName)) {
      const a = argFor(args, o.propName);
      if (a) out.push({ expr: a, fileRel: f.rel, fileText: f.text });
    }
  }
  return out;
}

module.exports = { callArgs, argFor, bodyOf, fieldValues, fieldSubValues, componentNameOf, propExprs };
