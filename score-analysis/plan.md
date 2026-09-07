# 成绩单转换器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把老师导出的成绩单 xls，在浏览器本地解析成一张逐生转换表（六板块得分 + 客观80/主观40 + 120/130/150 折算），一键复制/导出。

**Architecture:** 纯逻辑（列识别、归并、合并、序列化）抽到无 DOM/无 SheetJS 的 ESM 模块 `score-convert.js`，用 `node --test` 单测；`index.html` 仅做 SheetJS 文件解析 + 调用纯模块 + 渲染表格 + 复制导出。首页加入口卡片。

**Tech Stack:** 原生 HTML/CSS/JS（ESM module）；SheetJS 0.18.5（CDN，仅页面用）；Node 24 内置 `node --test`（单测，零新依赖）；Playwright（既有 smoke）。

设计依据：[docs/planning/2026-05-31-score-report-converter-design.md](2026-05-31-score-report-converter-design.md)

---

## File Structure

- Create `docs/score-analysis/score-convert.js` — 纯逻辑模块，导出 `detectSections / parseExamScores / buildStudentRows / parseSpeakingInput / mergeSpeaking / toTable / toTSV / toCSV` 及常量。
- Create `test/score-convert.test.js` — `node --test` 单测（`test/` 单数目录，不被 Playwright 的 `./tests` 扫描）。
- Replace `docs/score-analysis/index.html` — 现占位页改为真实工具页（SheetJS + 调用模块 + 渲染 + 复制/导出 + 隐私提示）。
- Create `tests/score-analysis.spec.js` — Playwright 冒烟（页面加载 + 关键元素 + 首页入口链接）。
- Modify `docs/index.html` — 两处 modules-grid 各加一张「成绩分析 · 试用」卡片。
- Modify `package.json` — 加 `test:unit` 脚本。
- Delete `private/score-analysis-local/index.html` — 旧私有工具。

### 数据契约（SheetJS `sheet_to_json(sheet,{header:1,raw:true,defval:''})` 的产物）

`学生小题分` 表：`rows[0]`=题号表头（如 `21（答案C）`，选择题答案列为 `''`），`rows[1]`=子表头（`得分`/`作答`），`rows[2..]`=学生数据。元数据列：`序号/姓名/班级/学号/考号/总分`，题列从「总分」列之后开始。选择题 = 「得分」列后紧跟「作答」列；非选择题 = 仅「得分」列。

`考生成绩-英语` 表：`rows[0]`=表头（`姓名/班级/学号/考号/班内学号（座位号）/学籍号/得分/年级排名/班级排名/档次`），`rows[1..]`=数据。

### 板块识别规则（不写死题号）

- 题列按是否有「作答」配对分为选择题 / 非选择题。
- 每个得分列算 `colMax`（全体学生该列最大值）。
- 选择题中 `colMax >= 2`（即 2.5 分）→ 阅读理解 + 七选五；其中**七选五** = 从第一个答案 ∈ {E,F,G} 的题到该 2.5 段末尾（回退：2.5 段最后 5 题），其余为**阅读理解**。
- 选择题中 `colMax < 2`（即 1.0/1.5 分）→ **完形填空**。
- 非选择题中 `colMax > 5` → 作文：按出现顺序第一个=**应用文**、第二个=**续写**。
- 非选择题中 `colMax <= 5` → **语法填空**。
- `scope` = 有作文板块则 120，否则 80。

---

## Task 1: 纯模块脚手架 + `detectSections`

**Files:**
- Create: `docs/score-analysis/score-convert.js`
- Create: `test/score-convert.test.js`
- Modify: `package.json`

- [ ] **Step 1: 加 npm 单测脚本**

在 `package.json` 的 `scripts` 中，在 `"check"` 行后加一行：

```json
    "test:unit": "node --test test/",
```

（保持 JSON 合法：给上一行 `"check": "bash scripts/check_all.sh",` 末尾逗号，新行后接 `"test:smoke"`。）

- [ ] **Step 2: 写共享测试夹具 + `detectSections` 失败测试**

创建 `test/score-convert.test.js`：

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectSections, parseExamScores, buildStudentRows,
  parseSpeakingInput, mergeSpeaking, toTable, toTSV, toCSV,
} from '../docs/score-analysis/score-convert.js';

// 小题分表夹具：阅读3题(2.5) 七选2题(2.5,含G/E) 完形2题(1.0) 语法2题(1.5) 应用文 续写
export const H0 = ['序号','姓名','班级','学号','考号','总分',
  '21（答案C）','','22（答案A）','','23（答案B）','',
  '36（答案G）','','37（答案E）','',
  '41（答案B）','','42（答案C）','',
  '56','57','66','67'];
export const H1 = ['','','','','','',
  '得分','作答','得分','作答','得分','作答',
  '得分','作答','得分','作答',
  '得分','作答','得分','作答',
  '得分','得分','得分','得分'];
// 张三 学号1001：阅读5/七选5/完形1/语法3/应用文12/续写16 = 客观14 主观28 总分42
export const ROW_A = [1,'张三','2023级15班','1001','1001',42,
  2.5,'',2.5,'',0,'', 2.5,'',2.5,'', 1.0,'',0,'', 1.5,1.5, 12,16];
// 李四 学号1002：阅读5/七选2.5/完形2/语法1.5/应用文9/续写20 = 客观11 主观29 总分40
export const ROW_B = [2,'李四','2023级15班','1002','1002',40,
  2.5,'',0,'',2.5,'', 0,'',2.5,'', 1.0,'',1.0,'', 0,1.5, 9,20];
export const DATA = [ROW_A, ROW_B];

// 考生成绩-英语表夹具（用于合并排名/档次）
export const EXAM_H = ['姓名','班级','学号','考号','班内学号（座位号）','学籍号','得分','年级排名','班级排名','档次'];
export const EXAM_ROWS = [
  ['张三','2023级15班','1001','1001','-','-',42,32,1,'A+'],
  ['李四','2023级15班','1002','1002','-','-',40,55,2,'A'],
];

test('detectSections 划分六板块并判定 scope=120', () => {
  const d = detectSections(H0, H1, DATA);
  assert.equal(d.scope, 120);
  const byName = Object.fromEntries(d.sections.map(s => [s.name, s]));
  assert.deepEqual(byName['阅读理解'].cols, [6, 8, 10]);
  assert.deepEqual(byName['七选五'].cols, [12, 14]);
  assert.deepEqual(byName['完形填空'].cols, [16, 18]);
  assert.deepEqual(byName['语法填空'].cols, [20, 21]);
  assert.deepEqual(byName['应用文'].cols, [22]);
  assert.deepEqual(byName['续写'].cols, [23]);
  assert.equal(byName['阅读理解'].kind, 'objective');
  assert.equal(byName['应用文'].kind, 'subjective');
  assert.deepEqual(d.meta, { nameCol: 1, clsCol: 2, idCol: 3, totalCol: 5 });
});

test('detectSections 无作文则 scope=80', () => {
  const h0 = H0.slice(0, 22);   // 去掉 66/67 两列
  const h1 = H1.slice(0, 22);
  const data = DATA.map(r => r.slice(0, 22));
  const d = detectSections(h0, h1, data);
  assert.equal(d.scope, 80);
  assert.ok(!d.sections.some(s => s.name === '应用文' || s.name === '续写'));
  assert.ok(d.sections.some(s => s.name === '语法填空'));
});
```

- [ ] **Step 3: 跑测试确认失败**

Run: `npm run test:unit`
Expected: FAIL —「does not provide an export named 'detectSections'」(模块尚未创建/无导出)。

- [ ] **Step 4: 实现 `score-convert.js` 骨架 + `detectSections`**

创建 `docs/score-analysis/score-convert.js`：

```js
// 纯逻辑：输入 SheetJS 解析出的行数组，输出逐生转换表数据。无 DOM、无 SheetJS 依赖。

export const SECTION_ORDER = ['阅读理解', '七选五', '完形填空', '语法填空', '应用文', '续写'];
export const OBJECTIVE = new Set(['阅读理解', '七选五', '完形填空', '语法填空']);
export const SUBJECTIVE = new Set(['应用文', '续写']);

function findCol(header, label) {
  for (let c = 0; c < header.length; c++) {
    if (String(header[c]).trim() === label) return c;
  }
  return -1;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// header0: 题号表头行；header1: 得分/作答子表头行；dataRows: 学生数据行
export function detectSections(header0, header1, dataRows) {
  const meta = {
    nameCol: findCol(header0, '姓名'),
    clsCol: findCol(header0, '班级'),
    idCol: findCol(header0, '学号'),
    totalCol: findCol(header0, '总分'),
  };
  const start = meta.totalCol >= 0 ? meta.totalCol + 1 : 6;

  // 收集题列
  const qcols = [];
  for (let c = start; c < header0.length; c++) {
    const sub = String(header1[c] || '').trim();
    if (sub === '作答') continue;          // 作答列附属前一个得分列
    if (sub !== '得分') continue;          // 非题列
    const isMC = String(header1[c + 1] || '').trim() === '作答';
    const m = String(header0[c] || '').match(/答案\s*([A-G])/);
    let colMax = 0;
    for (const row of dataRows) {
      const v = Number(row[c]);
      if (Number.isFinite(v) && v > colMax) colMax = v;
    }
    qcols.push({ col: c, isMC, answer: m ? m[1] : '', colMax });
  }

  const sect = {};
  const push = (name, col) => { (sect[name] ||= []).push(col); };

  // 选择题：2.5 段 = 阅读+七选；其余 MC = 完形
  const mc = qcols.filter(q => q.isMC);
  const big = mc.filter(q => q.colMax >= 2);   // 2.5 分组
  const small = mc.filter(q => q.colMax < 2);  // 1.0/1.5 分组 → 完形
  let sevenStart = big.findIndex(q => /[EFG]/.test(q.answer));
  if (sevenStart < 0) sevenStart = Math.max(0, big.length - 5);   // 回退：最后 5 题
  big.forEach((q, i) => push(i >= sevenStart ? '七选五' : '阅读理解', q.col));
  small.forEach(q => push('完形填空', q.col));

  // 非选择题：colMax>5 = 作文（按序 应用文/续写）；否则语法
  const nonMC = qcols.filter(q => !q.isMC);
  const writing = nonMC.filter(q => q.colMax > 5);
  const grammar = nonMC.filter(q => q.colMax <= 5);
  grammar.forEach(q => push('语法填空', q.col));
  if (writing[0]) push('应用文', writing[0].col);
  if (writing[1]) push('续写', writing[1].col);

  const sections = SECTION_ORDER
    .filter(name => sect[name] && sect[name].length)
    .map(name => ({ name, kind: OBJECTIVE.has(name) ? 'objective' : 'subjective', cols: sect[name] }));

  const scope = sections.some(s => s.kind === 'subjective') ? 120 : 80;
  return { scope, meta, sections };
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npm run test:unit`
Expected: PASS（2 个 detectSections 测试通过）。

- [ ] **Step 6: 提交**

```bash
git add package.json docs/score-analysis/score-convert.js test/score-convert.test.js
git commit -m "feat(score): detectSections 板块自动识别 + 单测脚手架"
```

---

## Task 2: `parseExamScores` + `buildStudentRows`

**Files:**
- Modify: `docs/score-analysis/score-convert.js`
- Modify: `test/score-convert.test.js`

- [ ] **Step 1: 写失败测试**

在 `test/score-convert.test.js` 末尾追加：

```js
test('parseExamScores 学号→排名档次', () => {
  const m = parseExamScores(EXAM_H, EXAM_ROWS);
  assert.deepEqual(m['1001'], { gradeRank: 32, classRank: 1, tier: 'A+' });
  assert.deepEqual(m['1002'], { gradeRank: 55, classRank: 2, tier: 'A' });
});

test('buildStudentRows 归并六板块 + 客观/主观 + 折算130 + 合并排名', () => {
  const d = detectSections(H0, H1, DATA);
  const exam = parseExamScores(EXAM_H, EXAM_ROWS);
  const rows = buildStudentRows(DATA, d, exam);
  const a = rows[0];
  assert.equal(a.name, '张三');
  assert.equal(a.id, '1001');
  assert.equal(a.sections['阅读理解'], 5);
  assert.equal(a.sections['七选五'], 5);
  assert.equal(a.sections['完形填空'], 1);
  assert.equal(a.sections['语法填空'], 3);
  assert.equal(a.sections['应用文'], 12);
  assert.equal(a.sections['续写'], 16);
  assert.equal(a.objective, 14);
  assert.equal(a.subjective, 28);
  assert.equal(a.total120, 42);
  assert.equal(a.converted130, 45.5);   // 42*130/120
  assert.equal(a.gradeRank, 32);
  assert.equal(a.classRank, 1);
  assert.equal(a.tier, 'A+');
  assert.equal(a.warn, false);
});

test('buildStudentRows 总分对不上时标 warn', () => {
  const bad = ROW_A.slice();
  bad[5] = 99;                       // 总分列与板块之和(42)不符
  const d = detectSections(H0, H1, DATA);
  const rows = buildStudentRows([bad], d, {});
  assert.equal(rows[0].warn, true);
  assert.equal(rows[0].reportedTotal, 99);
});

test('buildStudentRows 在 80 分卷不产出折算', () => {
  const h0 = H0.slice(0, 22), h1 = H1.slice(0, 22);
  const data = DATA.map(r => r.slice(0, 22));
  const d = detectSections(h0, h1, data);
  const rows = buildStudentRows(data, d, {});
  assert.equal(rows[0].converted130, null);
  assert.equal(rows[0].subjective, null);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm run test:unit`
Expected: FAIL —「parseExamScores is not a function」。

- [ ] **Step 3: 实现 `parseExamScores` + `buildStudentRows`**

在 `score-convert.js` 末尾追加：

```js
// 考生成绩-英语表 → { 学号: {gradeRank, classRank, tier} }
export function parseExamScores(header, rows) {
  if (!header) return {};
  const idCol = findCol(header, '学号');
  const gCol = findCol(header, '年级排名');
  const cCol = findCol(header, '班级排名');
  const tCol = findCol(header, '档次');
  const map = {};
  for (const r of rows || []) {
    const id = String(r[idCol] ?? '').trim();
    if (!id) continue;
    map[id] = {
      gradeRank: gCol >= 0 ? r[gCol] : '',
      classRank: cCol >= 0 ? r[cCol] : '',
      tier: tCol >= 0 ? r[tCol] : '',
    };
  }
  return map;
}

export function buildStudentRows(dataRows, detection, examMap) {
  const { meta, sections, scope } = detection;
  const exam = examMap || {};
  return (dataRows || []).map(row => {
    const sectionScores = {};
    let objective = 0, subjective = 0;
    let hasSubjective = false;
    for (const s of sections) {
      let sum = 0;
      for (const c of s.cols) {
        const v = Number(row[c]);
        if (Number.isFinite(v)) sum += v;
      }
      sum = round2(sum);
      sectionScores[s.name] = sum;
      if (s.kind === 'objective') objective += sum;
      else { subjective += sum; hasSubjective = true; }
    }
    objective = round2(objective);
    subjective = hasSubjective ? round2(subjective) : null;
    const total120 = round2(objective + (subjective || 0));
    const reported = Number(row[meta.totalCol]);
    const warn = Number.isFinite(reported) ? Math.abs(reported - total120) > 0.5 : false;
    const converted130 = scope === 120 ? round2(total120 * 130 / 120) : null;
    const id = String(row[meta.idCol] ?? '').trim();
    const rk = exam[id] || {};
    return {
      id,
      name: String(row[meta.nameCol] ?? '').trim(),
      cls: String(row[meta.clsCol] ?? '').trim(),
      sections: sectionScores,
      objective,
      subjective,
      total120,
      converted130,
      listening: null,
      total150: null,
      gradeRank: rk.gradeRank ?? '',
      classRank: rk.classRank ?? '',
      tier: rk.tier ?? '',
      reportedTotal: Number.isFinite(reported) ? reported : null,
      warn,
    };
  });
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm run test:unit`
Expected: PASS（全部 detect + parseExam + build 测试通过）。

- [ ] **Step 5: 提交**

```bash
git add docs/score-analysis/score-convert.js test/score-convert.test.js
git commit -m "feat(score): buildStudentRows 归并/客观主观/折算130/排名合并/总分校验"
```

---

## Task 3: `parseSpeakingInput` + `mergeSpeaking`

**Files:**
- Modify: `docs/score-analysis/score-convert.js`
- Modify: `test/score-convert.test.js`

- [ ] **Step 1: 写失败测试**

在 `test/score-convert.test.js` 末尾追加：

```js
test('parseSpeakingInput 解析「学号 分数」文本，跳过表头', () => {
  const txt = '学号\t听说\n1001\t18\n1002, 15.5\n';
  const m = parseSpeakingInput(txt);
  assert.equal(m['1001'], 18);
  assert.equal(m['1002'], 15.5);
});

test('mergeSpeaking 按学号补出听说与总分150', () => {
  const d = detectSections(H0, H1, DATA);
  const rows = buildStudentRows(DATA, d, {});
  const res = mergeSpeaking(rows, { '1001': 18 });
  assert.equal(res.matched, 1);
  assert.equal(res.unmatched, 1);
  assert.equal(rows[0].listening, 18);
  assert.equal(rows[0].total150, 63.5);   // 45.5 + 18
  assert.equal(rows[1].listening, null);
  assert.equal(rows[1].total150, null);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm run test:unit`
Expected: FAIL —「parseSpeakingInput is not a function」。

- [ ] **Step 3: 实现**

在 `score-convert.js` 末尾追加：

```js
// 解析粘贴/上传的听说成绩文本：每行「学号 <分隔> 分数」，分隔可为 制表符/逗号/空格。
export function parseSpeakingInput(text) {
  const map = {};
  for (const line of String(text || '').split(/\r?\n/)) {
    const parts = line.trim().split(/[\t,，\s]+/).filter(Boolean);
    if (parts.length < 2) continue;
    const id = parts[0].trim();
    const score = Number(parts[parts.length - 1]);
    if (!Number.isFinite(score)) continue;   // 表头行（分数非数字）自动跳过
    map[id] = score;
  }
  return map;
}

// 把听说分按学号合并进逐生行，补出 total150。直接修改并返回统计。
export function mergeSpeaking(rows, speakingMap) {
  let matched = 0, unmatched = 0;
  for (const r of rows) {
    const v = speakingMap[r.id];
    if (Number.isFinite(v) && r.converted130 != null) {
      r.listening = v;
      r.total150 = Math.round((r.converted130 + v + Number.EPSILON) * 100) / 100;
      matched++;
    } else {
      r.listening = null;
      r.total150 = null;
      unmatched++;
    }
  }
  return { matched, unmatched };
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm run test:unit`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add docs/score-analysis/score-convert.js test/score-convert.test.js
git commit -m "feat(score): 听说成绩解析 + 按学号合并出总分150"
```

---

## Task 4: `toTable` + `toTSV` + `toCSV`

**Files:**
- Modify: `docs/score-analysis/score-convert.js`
- Modify: `test/score-convert.test.js`

- [ ] **Step 1: 写失败测试**

在 `test/score-convert.test.js` 末尾追加：

```js
test('toTable 列随 scope/听说 伸缩', () => {
  const d = detectSections(H0, H1, DATA);
  const rows = buildStudentRows(DATA, d, parseExamScores(EXAM_H, EXAM_ROWS));
  mergeSpeaking(rows, { '1001': 18 });
  const t = toTable(rows, d, { hasSpeaking: true });
  assert.deepEqual(t.columns, [
    '姓名','班级','学号','年级排名','班级排名','档次',
    '阅读理解','七选五','完形填空','语法填空','应用文','续写',
    '客观题(80)','主观题(40)','总分(120)','折算(130)','听说(20)','总分(150)',
  ]);
  assert.equal(t.data[0][0], '张三');
  assert.equal(t.data[0][t.columns.indexOf('折算(130)')], 45.5);
  assert.equal(t.data[0][t.columns.indexOf('总分(150)')], 63.5);
});

test('toTable 80 分卷去掉作文/折算/听说列', () => {
  const h0 = H0.slice(0, 22), h1 = H1.slice(0, 22);
  const data = DATA.map(r => r.slice(0, 22));
  const d = detectSections(h0, h1, data);
  const rows = buildStudentRows(data, d, {});
  const t = toTable(rows, d, { hasSpeaking: false });
  assert.ok(!t.columns.includes('主观题(40)'));
  assert.ok(!t.columns.includes('折算(130)'));
  assert.ok(!t.columns.includes('应用文'));
  assert.ok(t.columns.includes('客观题(80)'));
});

test('toTSV / toCSV 序列化', () => {
  const t = { columns: ['姓名', '总分(120)'], data: [['张三', 42], ['李,四', 40]] };
  assert.equal(toTSV(t), '姓名\t总分(120)\n张三\t42\n李,四\t40');
  assert.equal(toCSV(t), '姓名,总分(120)\n张三,42\n"李,四",40');
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm run test:unit`
Expected: FAIL —「toTable is not a function」。

- [ ] **Step 3: 实现**

在 `score-convert.js` 末尾追加：

```js
// 把逐生行铺成 { columns:[...], data:[[...]] }，列按 scope 与是否有听说伸缩。
export function toTable(rows, detection, opts) {
  const hasSpeaking = !!(opts && opts.hasSpeaking);
  const is120 = detection.scope === 120;
  const sectionNames = detection.sections.map(s => s.name);

  const columns = ['姓名', '班级', '学号', '年级排名', '班级排名', '档次', ...sectionNames, '客观题(80)'];
  if (is120) columns.push('主观题(40)', '总分(120)', '折算(130)');
  if (hasSpeaking) columns.push('听说(20)', '总分(150)');

  const blank = v => (v == null || v === '' ? '' : v);
  const data = rows.map(r => {
    const out = [r.name, r.cls, r.id, blank(r.gradeRank), blank(r.classRank), blank(r.tier)];
    for (const n of sectionNames) out.push(blank(r.sections[n]));
    out.push(blank(r.objective));
    if (is120) out.push(blank(r.subjective), blank(r.total120), blank(r.converted130));
    if (hasSpeaking) out.push(blank(r.listening), blank(r.total150));
    return out;
  });
  return { columns, data };
}

function joinRow(cells, sep, quote) {
  return cells.map(v => {
    const s = String(v ?? '');
    if (quote && /[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }).join(sep);
}

export function toTSV(table) {
  return [table.columns, ...table.data].map(r => joinRow(r, '\t', false)).join('\n');
}

export function toCSV(table) {
  return [table.columns, ...table.data].map(r => joinRow(r, ',', true)).join('\n');
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm run test:unit`
Expected: PASS（全部单测通过）。

- [ ] **Step 5: 提交**

```bash
git add docs/score-analysis/score-convert.js test/score-convert.test.js
git commit -m "feat(score): toTable 列自适应 + TSV/CSV 序列化"
```

---

## Task 5: 工具页 `index.html` + Playwright 冒烟

**Files:**
- Replace: `docs/score-analysis/index.html`
- Create: `tests/score-analysis.spec.js`

- [ ] **Step 1: 写 Playwright 冒烟测试（先失败）**

创建 `tests/score-analysis.spec.js`：

```js
import { expect, test } from '@playwright/test';

test('score-analysis 页面加载且关键控件齐全', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/docs/score-analysis/');
  await expect(page.locator('#fileInput')).toHaveCount(1);
  await expect(page.locator('#copyBtn')).toHaveCount(1);
  await expect(page.locator('#exportBtn')).toHaveCount(1);
  await expect(page.locator('text=数据仅在本地浏览器处理')).toBeVisible();
  expect(errors).toEqual([]);
});

test('首页有成绩分析入口链接', async ({ page }) => {
  await page.goto('/docs/');
  await expect(page.locator('a[href="./score-analysis/"], [onclick*="score-analysis"]').first()).toHaveCount(1);
});
```

- [ ] **Step 2: 跑冒烟确认失败**

Run: `npm run test:smoke -- tests/score-analysis.spec.js`
Expected: FAIL（占位页无 `#fileInput`；首页无入口）。

- [ ] **Step 3: 写工具页**

用以下内容**整体替换** `docs/score-analysis/index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Seeklume · 成绩分析（试用）</title>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<style>
  :root { --bg:#f5f5f7; --surface:#fff; --border:#e5e5ea; --text:#1d1d1f; --text-2:#6e6e73; --accent:#0071e3; --warn:#fff4d6; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; padding:32px 24px; background:var(--bg); color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
  .wrap { max-width:1100px; margin:0 auto; }
  h1 { font-size:clamp(22px,4vw,30px); letter-spacing:-.4px; margin:0 0 6px; }
  .eyebrow { color:var(--accent); font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; }
  .privacy { margin:14px 0 22px; padding:10px 14px; border:1px solid var(--border); border-radius:10px;
    background:var(--surface); color:var(--text-2); font-size:13px; }
  .card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:20px; margin-bottom:18px; }
  .card h2 { font-size:15px; margin:0 0 12px; }
  label.file, button { display:inline-flex; align-items:center; justify-content:center; min-height:40px; padding:0 18px;
    border-radius:999px; border:1px solid var(--border); background:var(--surface); color:var(--text);
    font-size:14px; font-weight:600; cursor:pointer; }
  button.primary { border-color:var(--accent); background:var(--accent); color:#fff; }
  button:disabled { opacity:.45; cursor:default; }
  input[type=file] { display:none; }
  textarea { width:100%; min-height:84px; border:1px solid var(--border); border-radius:10px; padding:10px; font:13px/1.6 inherit; resize:vertical; }
  .row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  .note { font-size:13px; color:var(--text-2); margin-top:8px; }
  .err { color:#c0392b; }
  .table-scroll { overflow:auto; border:1px solid var(--border); border-radius:12px; }
  table { border-collapse:collapse; width:100%; font-size:13px; white-space:nowrap; }
  th, td { padding:7px 10px; border-bottom:1px solid var(--border); text-align:center; }
  th { position:sticky; top:0; background:#fafafa; font-weight:600; }
  td:first-child, th:first-child { text-align:left; }
  tr.warn td { background:var(--warn); }
  a.back { color:var(--accent); text-decoration:none; font-size:13px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="eyebrow">Trial · 本地工具</div>
  <h1>成绩分析 · 成绩单转换</h1>
  <div class="privacy">🔒 数据仅在本地浏览器处理，不上传、不保存到服务器。关闭页面即清空。</div>

  <div class="card">
    <h2>① 导入成绩单</h2>
    <div class="row">
      <label class="file" for="fileInput">选择 / 拖入 xls 文件</label>
      <span id="fileName" class="note"></span>
    </div>
    <input id="fileInput" type="file" accept=".xls,.xlsx">
    <div id="scopeNote" class="note"></div>
    <div id="errBox" class="note err"></div>
  </div>

  <div class="card" id="speakingCard" style="display:none;">
    <h2>② 听说成绩（可选 · 折算到 150 分）</h2>
    <textarea id="speakingInput" placeholder="粘贴「学号 听说分」，每行一个（分隔可用空格/制表符/逗号）。也可不填，只看 130 分折算。"></textarea>
    <div class="row" style="margin-top:10px;">
      <button id="mergeBtn" type="button">合并听说分</button>
      <span id="mergeNote" class="note"></span>
    </div>
  </div>

  <div class="card" id="resultCard" style="display:none;">
    <h2>③ 逐生转换表</h2>
    <div class="row" style="margin-bottom:12px;">
      <button id="copyBtn" class="primary" type="button" disabled>复制到剪贴板</button>
      <button id="exportBtn" type="button" disabled>导出 CSV</button>
      <span id="copyNote" class="note"></span>
    </div>
    <div class="table-scroll"><table id="resultTable"></table></div>
  </div>

  <p><a class="back" href="../">← 返回首页</a></p>
</div>

<script type="module">
import { detectSections, parseExamScores, buildStudentRows, parseSpeakingInput, mergeSpeaking, toTable, toTSV, toCSV }
  from './score-convert.js';

const $ = id => document.getElementById(id);
let state = { detection: null, rows: null, examMap: {}, table: null };

function findSheet(wb, keyword) {
  const name = wb.SheetNames.find(n => n.includes(keyword));
  return name ? XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' }) : null;
}

function setError(msg) { $('errBox').textContent = msg || ''; }

function render() {
  const hasSpeaking = state.rows.some(r => r.total150 != null);
  state.table = toTable(state.rows, state.detection, { hasSpeaking });
  const t = state.table;
  let html = '<thead><tr>' + t.columns.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>';
  t.data.forEach((row, i) => {
    const warn = state.rows[i].warn ? ' class="warn"' : '';
    html += '<tr' + warn + '>' + row.map(v => '<td>' + (v === '' ? '' : v) + '</td>').join('') + '</tr>';
  });
  $('resultTable').innerHTML = html + '</tbody>';
  $('copyBtn').disabled = false;
  $('exportBtn').disabled = false;
  $('resultCard').style.display = '';
}

async function handleFile(file) {
  setError('');
  $('fileName').textContent = file.name;
  if (!window.XLSX) { setError('Excel 解析库未加载，请检查网络后刷新。'); return; }
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
    const detail = findSheet(wb, '小题分');
    if (!detail) { setError('没找到「学生小题分」工作表，请确认导出的是完整成绩单。'); return; }
    const exam = findSheet(wb, '考生成绩');
    state.detection = detectSections(detail[0], detail[1], detail.slice(2));
    state.examMap = exam ? parseExamScores(exam[0], exam.slice(1)) : {};
    state.rows = buildStudentRows(detail.slice(2), state.detection, state.examMap);
    const warnCount = state.rows.filter(r => r.warn).length;
    $('scopeNote').textContent = '识别为 ' + state.detection.scope + ' 分卷，共 ' + state.rows.length + ' 名学生'
      + (warnCount ? '（' + warnCount + ' 行总分与板块之和不符，已标黄）' : '') + '。';
    $('speakingCard').style.display = state.detection.scope === 120 ? '' : 'none';
    render();
  } catch (e) {
    setError('解析失败：' + e.message);
  }
}

$('fileInput').addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });
['dragover', 'drop'].forEach(ev => document.body.addEventListener(ev, e => e.preventDefault()));
document.body.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) handleFile(f); });

$('mergeBtn').addEventListener('click', () => {
  if (!state.rows) return;
  const map = parseSpeakingInput($('speakingInput').value);
  const res = mergeSpeaking(state.rows, map);
  $('mergeNote').textContent = '匹配 ' + res.matched + ' 人，未匹配 ' + res.unmatched + ' 人。';
  render();
});

$('copyBtn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(toTSV(state.table)); $('copyNote').textContent = '已复制，可直接粘贴到 Excel。'; }
  catch (e) { $('copyNote').textContent = '复制失败，请手动选择表格。'; }
});

$('exportBtn').addEventListener('click', () => {
  const blob = new Blob(['﻿' + toCSV(state.table)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '成绩分析转换表.csv';
  a.click();
  URL.revokeObjectURL(a.href);
});
</script>
</body>
</html>
```

- [ ] **Step 4: 跑冒烟确认页面项通过（首页项仍会失败）**

Run: `npm run test:smoke -- tests/score-analysis.spec.js`
Expected: 第 1 个测试 PASS；第 2 个（首页入口）FAIL —下个 Task 加入口。

- [ ] **Step 5: 提交**

```bash
git add docs/score-analysis/index.html tests/score-analysis.spec.js
git commit -m "feat(score): 成绩单转换工具页（本地解析+逐生表+复制/导出）"
```

---

## Task 6: 首页入口卡片

**Files:**
- Modify: `docs/index.html`（两处 `modules-grid`）

- [ ] **Step 1: 落地页网格加卡片**

在 `docs/index.html` 中，定位语法填空卡片之后、完形填空卡片之前（落地场景，约 1069 行 `</div>` 与 1070 行 `<div class="module-card coming fade-up delay-3">` 之间）插入：

```html
        <div class="module-card available fade-up delay-3" onclick="location.href='./score-analysis/'">
          <span class="module-badge live">试用</span>
          <div class="module-num">★</div>
          <h3>成绩分析</h3>
          <p>导入成绩单 · 六板块归并 · 客观/主观 · 120/130/150 折算</p>
          <div class="module-meta">本地小工具 · 数据不上传</div>
        </div>
```

- [ ] **Step 2: 模块视图网格加卡片**

在 `docs/index.html` 的 modules 视图网格中，语法填空 `</a>`（约 1146 行）之后、完形填空 `<div class="module-card coming">`（约 1147 行）之前插入：

```html
      <a class="module-card available" href="./score-analysis/">
        <span class="module-badge live">试用</span>
        <div class="module-num">★</div>
        <h3>成绩分析</h3>
        <p>导入老师成绩单 → 逐生转换表（六板块 + 客观/主观 + 折算）</p>
        <div class="module-meta">本地小工具 · 数据不上传</div>
      </a>
```

- [ ] **Step 3: 跑冒烟确认全过**

Run: `npm run test:smoke -- tests/score-analysis.spec.js`
Expected: 两个测试都 PASS。

- [ ] **Step 4: 提交**

```bash
git add docs/index.html
git commit -m "feat(score): 首页加成绩分析试用入口卡片"
```

---

## Task 7: 删除旧私有工具 + 整体验证

**Files:**
- Delete: `private/score-analysis-local/index.html`

- [ ] **Step 1: 删除旧工具**

```bash
rm private/score-analysis-local/index.html
rmdir private/score-analysis-local 2>/dev/null; true
```

（`private/` 已在 `.gitignore`，无需 git rm；删除本地文件即可。）

- [ ] **Step 2: 跑全部自动化测试**

Run: `npm run test:unit && npm run test:smoke -- tests/score-analysis.spec.js`
Expected: 单测全 PASS；两个冒烟 PASS。

- [ ] **Step 3: 用真实样本手动验证（关键）**

```bash
python3 -m http.server 8931 &
```

浏览器打开 `http://localhost:8931/docs/score-analysis/`，导入 `~/Downloads/成绩单-4.xls`，核对：
- 识别为 **120 分卷**，约 46 名学生；
- 某学生（如韦一，总分 94）六板块之和 = 94，客观 + 主观 = 94，无标黄；
- 客观题列 ≤ 80、主观题列 ≤ 40；
- 折算(130) = 总分 × 130/120；
- 「复制到剪贴板」粘进 Excel 列对齐；「导出 CSV」中文不乱码。
- 在听说框粘几行「学号 18」，合并后出现「听说/总分(150)」列且 = 折算130 + 18。

完成后 `kill %1` 关掉服务器。

- [ ] **Step 4: 提交（如有首页/文档微调）**

```bash
git add -A
git commit -m "chore(score): 删除旧私有成绩工具 + 真实样本验证通过"
```

---

## Self-Review 记录

- **Spec 覆盖**：隐私本地（Task5 页面 banner + 无网络）✓；输入结构/三表（Task1-2 契约+解析）✓；自动识别 80/120（Task1 detect + 测试）✓；折算130 + 听说150（Task2-3）✓；逐生表列自适应 + 合并排名档次（Task2/4）✓；复制/CSV（Task4-5）✓；首页入口（Task6）✓；删旧工具（Task7）✓；真实样本校验（Task7 Step3）✓。
- **占位扫描**：无 TBD/TODO；每个改代码的步骤都给了完整代码。
- **类型一致**：`detectSections`→`{scope,meta,sections[{name,kind,cols}]}`；`buildStudentRows` 行对象字段（sections/objective/subjective/total120/converted130/listening/total150/gradeRank/classRank/tier/reportedTotal/warn）在 Task2 定义、Task3 写 listening/total150、Task4 `toTable` 读同名字段 — 一致。函数名 `parseExamScores/parseSpeakingInput/mergeSpeaking/toTable/toTSV/toCSV` 全程一致。
