/* hall-seating.js — 礼堂排座纯逻辑模块（无 DOM 依赖）
   场地数据来源：大礼堂1-2楼.pdf 矢量提取（2026-08 校准）
   每排 segs = [x起点, x终点, 座位数]，坐标为座位中心（PDF 单位）
   排内座位号：从左到右 01 起连续编号
   区块：每层按过道分左/中/右三区，排座以区块为单位（v2 区块连座） */

export const HALL = {
  f1: {
    name: '一楼',
    rows: [
      { y: 3290.6, segs: [[3589.0, 5909.1, 13]] },
      { y: 3486.2, segs: [[808.0, 2161.4, 8], [3491.2, 6007.0, 14], [7317.2, 8670.5, 8]] },
      { y: 3681.0, segs: [[808.0, 2161.4, 8], [3393.7, 6104.4, 15], [7317.2, 8670.5, 8]] },
      { y: 3877.4, segs: [[614.7, 2161.4, 9], [3297.8, 6200.3, 16], [7317.2, 8863.8, 9]] },
      { y: 4073.0, segs: [[513.0, 2059.6, 9], [3200.2, 6297.9, 17], [7418.9, 8965.6, 9]] },
      { y: 4272.0, segs: [[411.2, 1959.1, 9], [3104.2, 6400.1, 18], [7525.9, 9073.9, 9]] },
      { y: 4467.8, segs: [[309.4, 1857.3, 9], [3007.3, 6497.1, 19], [7627.8, 9175.7, 9]] },
      { y: 4663.5, segs: [[411.2, 1765.6, 8], [2910.4, 6594.0, 20], [7719.4, 9073.9, 8]] },
      { y: 4859.3, segs: [[314.5, 1668.9, 8], [2813.5, 6690.9, 21], [7816.2, 9170.6, 8]] },
      { y: 5374.8, segs: [[2716.3, 6792.7, 22]] },
      { y: 5568.6, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 5762.8, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 5957.0, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 6151.2, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 6345.4, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 6539.6, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 6733.7, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 6927.9, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 7122.1, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 7316.3, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 7510.5, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 7700.1, segs: [[101.8, 1657.3, 9], [2716.3, 6792.7, 22], [7827.8, 9383.3, 9]] },
      { y: 7894.3, segs: [[295.6, 1657.3, 8], [2716.3, 6792.7, 22], [7827.8, 9189.4, 8]] },
      { y: 8088.5, segs: [[295.6, 1657.3, 8], [2716.3, 6792.7, 22], [7827.8, 9189.4, 8]] },
      { y: 8282.7, segs: [[295.6, 1657.3, 8], [2716.3, 6792.7, 22], [7827.8, 9189.4, 8]] },
      { y: 8477.7, segs: [[489.5, 1657.3, 7], [7827.8, 8995.6, 7]] },
      { y: 8671.7, segs: [[489.5, 1657.3, 7], [7827.8, 8995.6, 7]] }
    ]
  },
  f2: {
    name: '二楼',
    rows: [
      { y: 5491.0, segs: [[1015.8, 2356.5, 8], [3212.5, 7035.9, 21], [8156.9, 9499.6, 8]] },
      { y: 5682.5, segs: [[1015.8, 2356.5, 8], [3212.5, 7035.9, 21], [8156.9, 9499.6, 8]] },
      { y: 5873.9, segs: [[1015.8, 2356.5, 8], [3212.5, 7035.9, 21], [8156.9, 9499.6, 8]] },
      { y: 6065.4, segs: [[1015.8, 2356.5, 8], [3212.5, 7035.9, 21], [8156.9, 9499.6, 8]] },
      { y: 6256.9, segs: [[1207.0, 2356.5, 7], [3212.5, 7035.9, 21], [8156.9, 9308.4, 7]] },
      { y: 6448.4, segs: [[1398.1, 2356.5, 6], [3212.5, 7035.9, 21], [8156.9, 9117.3, 6]] },
      { y: 6639.9, segs: [[1782.3, 2356.5, 4], [3212.5, 7035.9, 21], [8156.9, 8924.3, 5]] }
    ]
  }
};

export const PALETTE = [
  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948',
  '#b07aa1', '#ff9da7', '#9c755f', '#8cd17d', '#b6992d', '#d37295'
];
export const COLOR_LEADER = '#6e7175';
export const COLOR_AWARD = '#d9a62e';

export const ZONE_NAMES = { L: '左区', M: '中区', R: '右区' };
const ZONE_ORDER_MID = ['M', 'L', 'R'];
const ZONE_ORDER_LTR = ['L', 'M', 'R'];

const pad2 = n => String(n).padStart(2, '0');
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function floorBounds(f) {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  f.rows.forEach(r => {
    yMin = Math.min(yMin, r.y); yMax = Math.max(yMax, r.y);
    r.segs.forEach(s => { xMin = Math.min(xMin, s[0]); xMax = Math.max(xMax, s[1]); });
  });
  return { xMin, xMax, yMin, yMax };
}

// 按段中心 x 归区：含楼层中心 → 中区；在其左 → 左区；在其右 → 右区
function zoneOfSeg(seg, cx) {
  return (seg[0] <= cx && seg[1] >= cx) ? 'M' : (seg[1] < cx ? 'L' : 'R');
}

function textColorFor(bg) {
  const c = bg.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#1d1d1f' : '#ffffff';
}

/* ---------- 排座 ---------- */

export function allocate(input) {
  const use2 = (input.floor2Count | 0) > 0;
  const seats = [];
  const floors = {};
  ['f1', 'f2'].forEach(fk => {
    const f = HALL[fk];
    const fb = floorBounds(f);
    const cx = (fb.xMin + fb.xMax) / 2;
    const rows = f.rows.map((r, ri) => {
      let n = 0;
      const rowSeats = [];
      r.segs.forEach(seg => {
        const [x0, x1, cnt] = seg;
        const zk = zoneOfSeg(seg, cx);
        for (let k = 0; k < cnt; k++) {
          const x = cnt === 1 ? x0 : x0 + k * (x1 - x0) / (cnt - 1);
          rowSeats.push({
            f: fk, fName: f.name, row: ri + 1, n: ++n, x, y: r.y, zone: zk,
            kind: (fk === 'f2' && !use2) ? 'unused' : 'empty',
            classId: null, className: '', student: null, color: null
          });
        }
      });
      return rowSeats;
    });
    floors[fk] = { key: fk, name: f.name, rows };
    rows.forEach(rs => seats.push(...rs));
  });

  // 领导席：一楼从最前排左侧占起
  let lead = input.leader && input.leader.enabled ? Math.max(0, input.leader.count | 0) : 0;
  if (lead > 0) {
    outer1:
    for (const rowSeats of floors.f1.rows) {
      for (const s of rowSeats) {
        if (s.kind !== 'empty') continue;
        s.kind = 'leader'; s.color = COLOR_LEADER;
        if (--lead <= 0) break outer1;
      }
    }
  }

  // 颁奖席：一楼从前排、主席台右侧（每排最右号往左）占起
  let aw = input.award && input.award.enabled ? Math.max(0, input.award.count | 0) : 0;
  const awardSeats = [];
  if (aw > 0) {
    outer2:
    for (const rowSeats of floors.f1.rows) {
      for (let i = rowSeats.length - 1; i >= 0; i--) {
        const s = rowSeats[i];
        if (s.kind !== 'empty') continue;
        s.kind = 'award'; s.color = COLOR_AWARD;
        awardSeats.push(s);
        if (--aw <= 0) break outer2;
      }
    }
  }
  if (input.award && Array.isArray(input.award.names)) {
    input.award.names.forEach((nm, i) => { if (awardSeats[i]) awardSeats[i].student = nm; });
  }

  // 班级：顺序即列表顺序（抽签在 UI 层完成）
  const classes = (input.classes || []).map(c => ({ ...c }));
  classes.forEach(c => {
    c.count = Math.max(0, c.count | 0);
    if (input.granularity === 'student' && Array.isArray(c.names) && c.names.length) c.count = c.names.length;
  });
  const active = classes.filter(c => c.count > 0);

  let n2 = Math.min(Math.max(input.floor2Count | 0, 0), Math.max(active.length - 1, 0));
  if (!active.length) n2 = 0;
  const f1c = active.slice(0, active.length - n2);
  const f2c = n2 > 0 ? active.slice(active.length - n2) : [];

  const colorOf = {};
  classes.forEach((c, i) => { colorOf[c.id] = PALETTE[i % PALETTE.length]; });

  function assignFloor(fk, cls) {
    const floorRows = floors[fk].rows;
    const zOrder = input.zoneOrder === 'ltr' ? ZONE_ORDER_LTR : ZONE_ORDER_MID;
    const back = input.direction === 'back';
    // 区块 = 左/中/右三区；整班优先落单区，超大班整块跨相邻区（横过道属同区自然延伸，不算拆散）
    const zones = zOrder
      .map(zk => {
        let rows = floorRows.map(rs => rs.filter(s => s.zone === zk && s.kind === 'empty')).filter(rs => rs.length);
        if (back) rows = rows.slice().reverse();
        return { zk, rows };
      })
      .filter(z => z.rows.length);

    // 每区独立指针
    const cursors = zones.map(() => ({ ri: 0, si: 0 }));
    const zoneRemain = i => {
      const z = zones[i], p = cursors[i];
      let rem = 0;
      for (let r = p.ri; r < z.rows.length; r++) rem += r === p.ri ? z.rows[r].length - p.si : z.rows[r].length;
      return rem;
    };
    // 在区 i 内从指针连续放 upTo 个座位（不跨出该区），并分配班内序号
    const fillZone = (c, i, upTo) => {
      const z = zones[i], p = cursors[i];
      let left = upTo, placed = 0;
      while (left > 0 && p.ri < z.rows.length) {
        const row = z.rows[p.ri];
        if (p.si >= row.length) { p.ri++; p.si = 0; continue; }
        const take = Math.min(left, row.length - p.si);
        const seg = row.slice(p.si, p.si + take);
        c.parts.push({ zone: z.zk, row: seg[0].row, from: seg[0].n, to: seg[seg.length - 1].n, count: take });
        seg.forEach(s => { s.kind = 'class'; s.classId = c.id; s.className = c.name; s.color = colorOf[c.id]; s.seq = ++c.seqNo; });
        left -= take; placed += take; p.si += take;
        if (p.si >= row.length) { p.ri++; p.si = 0; }
      }
      return placed;
    };
    // 该班能否在本层不同区之间跨区凑出连续大块（配合兜底使用）
    const isAdj = (a, b) => zones[a].zk === 'M' || zones[b].zk === 'M';

    let wingFlip = false;
    cls.forEach(c => {
      const need = c.count;
      c.floor = fk;
      c.parts = [];
      c.seated = 0;
      c.unseated = need;
      c.seqNo = 0;
      if (need <= 0) { c.unseated = 0; return; }

      // 楼层级硬约束：班级绝不能跨楼层。二楼若无法让全班「聚集地」完整坐下，
      // 则一个都不排在本层，整班留给一楼（f1 是最后一层，总能装下）。
      // 该判定由下方兜底统一处理（单区能装→装；不能→跨区需形成整块，否则整班留一楼）。

      // 聚集第一：优先整班装进单个区（绝不跨左右过道）。
      // 中区优先模式下，中区装不下后两翼交替起填（左先/右先轮换）：
      // 两翼都从前往后坐，空位集中在两翼后排，避免一边填满、另一边全空。
      let tryOrder = zones;
      if (input.zoneOrder !== 'ltr') {
        const mid = zones.filter(z => z.zk === 'M');
        const wings = zones.filter(z => z.zk !== 'M');
        if (wings.length === 2) {
          tryOrder = wingFlip ? [...mid, wings[1], wings[0]] : [...mid, ...wings];
          wingFlip = !wingFlip;
        }
      }
      let placed = 0;
      for (let i = 0; i < tryOrder.length && placed === 0; i++) {
        const zi = zones.indexOf(tryOrder[i]);
        if (zoneRemain(zi) < need) continue;
        placed = fillZone(c, zi, need);
      }
      // 超大班兜底：单个区装不下 → 只在能形成「整块」时才跨相邻区（M-L / M-R），
      // 拒绝碎尾巴孤悬。二楼凑不出整块就整班留一楼——班级绝不跨楼层、绝不碎块。
      if (placed === 0) {
        const MIN_BLK = Math.max(6, Math.ceil(need * 0.12));
        const byRemain = zones.map((z, i) => i).sort((a, b) => zoneRemain(b) - zoneRemain(a));
        let done = false;
        for (const main of byRemain) {
          const tailNeed = need - zoneRemain(main);
          if (tailNeed <= 0) continue;            // 单区已在前面整装
          if (tailNeed < MIN_BLK) continue;       // 尾巴太小 = 碎块，换主区
          const adj = byRemain.find(j => j !== main && isAdj(main, j) && zoneRemain(j) >= tailNeed);
          if (adj == null) continue;
          let left = need;
          left -= fillZone(c, main, left);
          left -= fillZone(c, adj, left);
          placed = need - left;
          done = true;
          break;
        }
        if (!done) {
          if (fk === 'f2') {
            // 二楼凑不出整块 → 整班留一楼（f1 单区大，必能整装）
            c.seated = 0; c.unseated = need; c.skipFloor = true;
            return;
          }
          // 一楼兜底（楼层内）尽力整块延伸，避免超容
          const main = byRemain.length ? byRemain[0] : -1;
          if (main >= 0) {
            let left = need;
            left -= fillZone(c, main, left);
            for (const i of byRemain) {
              if (left <= 0) break;
              if (i === main || !isAdj(main, i)) continue;
              left -= fillZone(c, i, left);
            }
            placed = need - left;
          }
        }
      }
      c.seated = placed;
      c.unseated = need - placed;
    });

    // 例外兜底（仅 compact 开启时）：牺牲聚集换坐满，把"整班未排"的班散填进剩余碎片位
    const stillEmpty = [];
    zones.forEach(z => z.rows.forEach(rs => rs.forEach(s => { if (s.kind === 'empty') stillEmpty.push(s); })));
    if (input.compact && stillEmpty.length) {
      let k = 0;
      cls.forEach(c => {
        if (c.unseated <= 0) return;
        let seqNo = c.seqNo;
        let cur = null;
        while (c.unseated > 0 && k < stillEmpty.length) {
          const s = stillEmpty[k];
          s.kind = 'class'; s.classId = c.id; s.className = c.name; s.color = colorOf[c.id]; s.seq = ++seqNo;
          if (!cur || cur.row !== s.row || cur.zone !== s.zone || cur.to !== s.n - 1) {
            cur = { zone: s.zone, row: s.row, from: s.n, to: s.n, count: 1 };
            c.parts.push(cur);
          } else { cur.to = s.n; cur.count++; }
          k++; c.unseated--; c.seated++;
        }
      });
    }

    // 学生对号：凡该班贴了名单就把姓名填到座位上（不限于学生级粒度）。
    // 手动调整始终按座位格工作，是否有姓名不影响移动能力。
    cls.forEach(c => {
      if (!Array.isArray(c.names) || !c.names.length) return;
      let k2 = 0;
      c.parts.forEach(p => {
        const rowSeats = floorRows.find(rs => rs[0].row === p.row);
        rowSeats.forEach(s => {
          if (s.kind === 'class' && s.classId === c.id && s.n >= p.from && s.n <= p.to) {
            s.student = c.names[k2++] || null;
          }
        });
      });
    });
  }
  assignFloor('f2', f2c);
  // 二楼装不下的班整班挪回一楼（聚集第一：不拆散，只整体迁移到有空位的一楼大区）
  assignFloor('f1', f1c.concat(f2c.filter(c => c.unseated > 0)));

  const leaderCount = seats.filter(s => s.kind === 'leader').length;
  const awardCount = seats.filter(s => s.kind === 'award').length;
  const capacity = use2 ? 1179 : 933;
  const available = capacity - leaderCount - awardCount;
  const seated = active.reduce((a, c) => a + c.seated, 0);
  const totalPeople = active.reduce((a, c) => a + c.count, 0);

  return {
    seats, classes: active, colorOf,
    awardSeats,
    stats: {
      classCount: active.length, totalPeople, capacity, available,
      seated, empty: available - seated, unseated: totalPeople - seated,
      leaderCount, awardCount, use2
    }
  };
}

/* ---------- 手动调整 ---------- */

// 交换两个班的全部座位（身份对调），并重排班内序号与 parts；几何块形状不变，绝不新增拆散
export function swapClasses(res, idA, idB) {
  if (!idA || !idB || idA === idB) return false;
  const byId = {};
  res.classes.forEach(c => { byId[c.id] = c; });
  const ca = byId[idA], cb = byId[idB];
  if (!ca || !cb || ca.seated <= 0 || ca.seated !== cb.seated) return false;
  // 1) 互换两块区域的班级归属
  res.seats.forEach(s => {
    if (s.kind !== 'class') return;
    if (s.classId === idA) { s.classId = idB; s.className = cb.name; s.color = res.colorOf[idB]; }
    else if (s.classId === idB) { s.classId = idA; s.className = ca.name; s.color = res.colorOf[idA]; }
  });
  // 2) 重排序号 + 按各自名单对号，保证学生姓名跟随整班（贴名单班也能安全互换）
  reindexRes(res);
  [ca, cb].forEach(c => {
    const seats = res.seats.filter(s => s.classId === c.id).sort((a, b) => a.seq - b.seq);
    seats.forEach(s => { s.student = null; });
    if (Array.isArray(c.names) && c.names.length) {
      seats.forEach((s, i) => { s.student = c.names[i] != null ? c.names[i] : null; });
    }
  });
  return true;
}

// 依据当前 seats 的 classId 现状，重建每个班的 parts、班内序号、已坐/未坐
export function reindexRes(res) {
  const byId = {};
  res.classes.forEach(c => {
    byId[c.id] = c;
    c.parts = [];
    c.seated = 0;
    c.unseated = c.count;
    c.seqNo = 0;
    c.floor = null;
  });
  const cur = {};
  res.seats.forEach(s => {
    if (s.kind !== 'class' || !s.classId) return;
    const c = byId[s.classId];
    if (!c) return;
    if (c.floor === null) c.floor = s.f;
    const pc = cur[s.classId];
    if (pc && pc.zone === s.zone && pc.row === s.row && s.n === pc.to + 1) {
      pc.to = s.n; pc.count++;
    } else {
      const np = { zone: s.zone, row: s.row, from: s.n, to: s.n, count: 1 };
      c.parts.push(np);
      cur[s.classId] = np;
    }
    s.seq = ++c.seqNo;
    s.className = c.name;
    c.seated++;
    c.unseated = c.count - c.seated;
  });
}

// 零散调整：互换两个座位格的"姓名（可空）+ 班级归属"，座位物理位置不变。
// 不依赖名单：只要是班级座位格，即使 student 为空也能移动/互换。
export function swapStudents(res, ia, ib) {
  const a = res.seats[ia], b = res.seats[ib];
  if (!a || !b || ia === ib) return false;
  const lock = k => k === 'leader' || k === 'award' || k === 'unused';
  if (lock(a.kind) || lock(b.kind)) return false;

  const isClassSeat = s => s.kind === 'class' && !!s.classId;
  if (!isClassSeat(a) && !isClassSeat(b)) return false;

  // 互换"学生 + 班级归属"；空座位 classId 为 null，正好把空位内容换过去
  ['student', 'classId'].forEach(k => { const t = a[k]; a[k] = b[k]; b[k] = t; });

  [a, b].forEach(s => {
    if (s.classId) {
      s.kind = 'class';
      const c = res.classes.find(x => x.id === s.classId);
      s.className = c ? c.name : (s.className || '');
      s.color = c ? res.colorOf[c.id] : s.color;
    } else {
      s.kind = 'empty';
      s.classId = null; s.className = ''; s.color = null; s.seq = null;
    }
  });

  reindexRes(res);
  return true;
}

// —— 局部目标块落位（核心）——
// 把一批"要动的人"放到目标座位起的连续位置；目标块原有人回填到来源座位。
// - 不限区、不限层：按全场排座阅读顺序（一楼→二楼、排→号）确定目标块。
// - 只改来源块和目标块，不整体洗牌后续座位；向前/向后移动都严格人数守恒。
// - 整班移动另由 moveClass 加上同楼层、同区、等人数互换等硬约束。
// moverIdxList：待移动座位下标（须为 kind==='class' 且有 classId）；targetIdx：目标座位下标。
// 返回是否成功（目标为锁定座或目标块越界时失败）。
export function cascadePlace(res, moverIdxList, targetIdx) {
  if (!Array.isArray(moverIdxList) || !moverIdxList.length) return false;
  const T = res.seats[targetIdx];
  if (!T || T.kind === 'unused' || T.kind === 'leader' || T.kind === 'award') return false;

  const lock = k => k === 'unused' || k === 'leader' || k === 'award';
  // 1) 全场可排座位有序表（排除锁定座），rankIdx：座位下标→阅读顺序位
  const rank = [], rankIdx = new Map();
  res.seats.forEach((s, i) => { if (!lock(s.kind)) { rankIdx.set(i, rank.length); rank.push({ i, s }); } });
  const L = rank.length;

  // 2) mover（保留传入顺序＝点选/班内顺序），记录来源 rank
  const movers = [], srcRanks = [];
  for (const i of [...new Set(moverIdxList)]) {
    const s = res.seats[i];
    if (s.kind !== 'class' || !s.classId) continue;
    movers.push({ student: s.student, classId: s.classId });
    const r = rankIdx.get(i);
    if (r != null) srcRanks.push(r);
  }
  if (!movers.length) return false;
  const m = movers.length;

  // 3) 占用序列（空位→null）
  const occ = rank.map(({ i }) => {
    const s = res.seats[i];
    return (s.kind === 'class' && s.classId) ? { student: s.student, classId: s.classId } : null;
  });
  // 4) 移除 mover 来源占用（仅清 mover，空位结构保留）
  srcRanks.forEach(r => { occ[r] = null; });

  // 5) 将 mover 放进目标块；目标块原有人员回填到 mover 的原座位。
  //    这是一种可逆、局部的“块交换”：不会把目标之后的全场座位整体洗牌，
  //    也不会在向后移动时把末尾人员挤出礼堂。
  const k = rankIdx.get(targetIdx) ?? L;
  const targetRanks = Array.from({ length: m }, (_, j) => k + j).filter(r => r < L);
  if (targetRanks.length !== m) return false;
  const targetSet = new Set(targetRanks);
  const sourceOutside = srcRanks.filter(r => !targetSet.has(r));
  const displaced = targetRanks.map(r => occ[r]).filter(Boolean);
  if (displaced.length > sourceOutside.length) return false;

  const writes = new Map();
  srcRanks.forEach(r => writes.set(r, null));
  targetRanks.forEach((r, j) => writes.set(r, movers[j]));
  sourceOutside.forEach((r, j) => writes.set(r, displaced[j] ?? null));

  writes.forEach((o, r) => {
    const { s } = rank[r];
    if (!o) {
      s.kind = 'empty'; s.classId = null; s.className = ''; s.color = null; s.student = null; s.seq = null;
      return;
    }
    const c = res.classes.find(x => x.id === o.classId);
    s.kind = 'class'; s.classId = o.classId; s.className = c ? c.name : ''; s.color = c ? res.colorOf[o.classId] : null; s.student = o.student;
  });

  reindexRes(res);
  return true;
}

// 整班挪动：空白目标需在同楼层同区放得下完整班级；已占目标仅允许与同人数班级换位。
// 班内姓名按原座位顺序跟随，绝不拆班、跨楼或把其他班挤散。
export function moveClass(res, id, fromSeat) {
  const idxs = res.seats.map((s, i) => i)
    .filter(i => res.seats[i].kind === 'class' && res.seats[i].classId === id)
    .sort((a, b) => (res.seats[a].seq || 0) - (res.seats[b].seq || 0));
  if (!idxs.length) return false;
  const target = res.seats[fromSeat];
  if (!target || target.kind === 'unused' || target.kind === 'leader' || target.kind === 'award') return false;
  if (target.kind === 'class') {
    if (target.classId === id) return false;
    return swapClasses(res, id, target.classId);
  }

  // 整班移到空位时，目标块必须位于同一楼层、同一区，且从目标座起连续为空。
  // 不允许为了“挪进去”而把其他班拆散或推到另一层。
  const zoneIdxs = res.seats.map((s, i) => i).filter(i => {
    const s = res.seats[i];
    return s.f === target.f && s.zone === target.zone && s.kind !== 'unused' && s.kind !== 'leader' && s.kind !== 'award';
  });
  const at = zoneIdxs.indexOf(fromSeat);
  if (at < 0) return false;
  const targets = zoneIdxs.slice(at, at + idxs.length);
  if (targets.length !== idxs.length || targets.some(i => res.seats[i].kind !== 'empty' && res.seats[i].classId !== id)) return false;

  // cascadePlace 的全场目标块与“同区目标块”不一定相同，因此在这里做局部搬移。
  const people = idxs.map(i => ({ student: res.seats[i].student, classId: id }));
  const targetSet = new Set(targets);
  idxs.forEach(i => {
    if (targetSet.has(i)) return;
    const s = res.seats[i];
    s.kind = 'empty'; s.classId = null; s.className = ''; s.color = null; s.student = null; s.seq = null;
  });
  targets.forEach((i, j) => {
    const s = res.seats[i], c = res.classes.find(x => x.id === id);
    s.kind = 'class'; s.classId = id; s.className = c ? c.name : ''; s.color = res.colorOf[id]; s.student = people[j].student;
  });
  reindexRes(res);
  return true;
}

// 座位格批量挪动：把多个班级座位格（可跨班、跨区、跨楼）按点选顺序放到「toSeat 起」的位置。
// 目标块原有人回填到来源座位，动作局部、可预期且人数守恒。
export function moveStudents(res, fromIdxs, toIdx) {
  if (!Array.isArray(fromIdxs) || !fromIdxs.length) return false;
  return cascadePlace(res, fromIdxs, toIdx);
}

/* ---------- 平面图 SVG ---------- */

export function buildPlanSVG(res, opts = {}) {
  const S = 0.15, PAD = 46, SQ = 27.5;
  const b1 = floorBounds(HALL.f1), b2 = floorBounds(HALL.f2);
  const W = Math.round((b1.xMax - b1.xMin) * S) + PAD * 2;
  const c1 = (b1.xMin + b1.xMax) / 2, c2 = (b2.xMin + b2.xMax) / 2;
  const X1 = x => (x - c1) * S + W / 2;
  const X2 = x => (x - c2) * S + W / 2;
  const STAGE_H = 76, GAP = 104;
  const f1Top = STAGE_H + 30;
  const Y1 = y => f1Top + (y - b1.yMin) * S;
  const f1H = (b1.yMax - b1.yMin) * S;
  const f2Top = f1Top + f1H + GAP;
  const Y2 = y => f2Top + (y - b2.yMin) * S;
  const f2H = (b2.yMax - b2.yMin) * S;
  const H = Math.round(f2Top + f2H + PAD);

  let g = '';
  // 舞台
  const sx0 = X1(2716), sx1 = X1(6793);
  g += `<rect x="${(sx0).toFixed(1)}" y="10" width="${(sx1 - sx0).toFixed(1)}" height="${STAGE_H - 16}" rx="12" class="stage-rect"/>`;
  g += `<text x="${(W / 2).toFixed(1)}" y="${(10 + (STAGE_H - 16) / 2 + 6).toFixed(1)}" text-anchor="middle" class="stage-label">主席台</text>`;
  g += `<text x="${PAD - 26}" y="24" class="floor-label">一楼</text>`;

  // 班级名标签几何：按「同层·同区」分段，每段取包围盒中心定位
  // （旧版取全局包围盒左上角：礼堂后排比前排宽，minX 来自后排、y 却在前排，
  //   标签会飘到过道或邻区上空；跨区班级也只有 1 个标签）
  const clsLabels = [];
  const fs = 14, LBL_H = 17;
  res.classes.forEach(c => {
    const box = new Map();
    res.seats.forEach(s => {
      if (s.classId !== c.id) return;
      const key = s.f + '|' + s.zone;
      let b = box.get(key);
      if (!b) { b = { mnX: Infinity, mxX: -Infinity, mnY: Infinity, mxY: -Infinity }; box.set(key, b); }
      const X = (s.f === 'f1' ? X1 : X2)(s.x);
      const Y = (s.f === 'f1' ? Y1 : Y2)(s.y);
      if (X < b.mnX) b.mnX = X;
      if (X > b.mxX) b.mxX = X;
      if (Y < b.mnY) b.mnY = Y;
      if (Y > b.mxY) b.mxY = Y;
    });
    box.forEach(b => {
      const tw = [...c.name].reduce((w, ch) => w + (ch.charCodeAt(0) > 255 ? fs : fs * 0.6), 0) + 12;
      clsLabels.push({ x: (b.mnX + b.mxX) / 2 - tw / 2, y: (b.mnY + b.mxY) / 2 - LBL_H / 2, w: tw, h: LBL_H, color: res.colorOf[c.id], name: c.name });
    });
  });

  // 座位
  res.seats.forEach((s, si) => {
    const X = (s.f === 'f1' ? X1 : X2)(s.x);
    const Y = (s.f === 'f1' ? Y1 : Y2)(s.y);
    const x = (X - SQ / 2).toFixed(1), y = (Y - SQ / 2).toFixed(1);
    const tip = `${s.fName}${ZONE_NAMES[s.zone] || ''} ${s.row}排 ${pad2(s.n)}号` +
      (s.kind === 'class' ? ` · ${s.className}${s.seq ? ` · 第${s.seq}号` : ''}` : '') +
      (s.student ? ` · ${s.student}` : '');
    let cls = 'seat', fill = '';
    if (s.kind === 'class') { fill = ` fill="${s.color}"`; }
    else if (s.kind === 'leader') { fill = ` fill="${COLOR_LEADER}"`; }
    else if (s.kind === 'award') { fill = ` fill="${COLOR_AWARD}"`; }
    else if (s.kind === 'unused') { cls = 'seat unused'; }
    else { cls = 'seat empty'; }
    const isSel = (opts.highlightClass && s.kind === 'class' && s.classId === opts.highlightClass)
      || (opts.highlightSeat != null && si === opts.highlightSeat)
      || (Array.isArray(opts.highlightSeats) && opts.highlightSeats.includes(si));
    const dc = s.kind === 'class' && s.classId ? ` data-class="${esc(s.classId)}"` : '';
    const selStyle = isSel ? ' style="stroke:#111111;stroke-width:2.8"' : '';
    g += `<g data-seat="${si}"${dc}><rect x="${x}" y="${y}" width="${SQ}" height="${SQ}" rx="4"${fill} class="${cls}"${selStyle}/><title>${esc(tip)}</title>`;
    let label = '';
    if (s.kind === 'class') {
      if (opts.showNames && s.student) label = s.student;
      else if (opts.showNumbers && s.seq) label = String(s.seq);
    } else if (opts.showNumbers && s.kind !== 'unused') {
      label = pad2(s.n);
    }
    const covered = clsLabels.some(L => X >= L.x - 2 && X <= L.x + L.w + 2 && Y >= L.y - 2 && Y <= L.y + L.h + 2);
    if (label && !covered) {
      const tc = s.color ? textColorFor(s.color) : '';
      g += `<text x="${X.toFixed(1)}" y="${(Y + (opts.showNames && label.length > 2 ? 2.5 : 3)).toFixed(1)}" text-anchor="middle" class="seat-txt${opts.showNames && label.length > 2 ? ' seat-name' : ''}"${tc ? ` fill="${tc}"` : ''}>${esc(label)}</text>`;
    }
    g += `</g>`;
  });

  // 班级名标签：白底 + 班级色描边，居中盖在每段色块正中，归属一目了然
  clsLabels.forEach(L => {
    g += `<rect x="${L.x.toFixed(1)}" y="${L.y.toFixed(1)}" width="${L.w.toFixed(1)}" height="${L.h}" rx="5" fill="#ffffff" fill-opacity=".96" stroke="${L.color}" stroke-width="1.4" pointer-events="none"/>`;
    g += `<text x="${(L.x + L.w / 2).toFixed(1)}" y="${(L.y + 13).toFixed(1)}" font-size="${fs}" font-weight="700" fill="#1d1d1f" text-anchor="middle" style="font-family:-apple-system,'PingFang SC',sans-serif" pointer-events="none">${esc(L.name)}</text>`;
  });

  // 排号（双侧）
  ['f1', 'f2'].forEach(fk => {
    const Xf = fk === 'f1' ? X1 : X2, Yf = fk === 'f1' ? Y1 : Y2;
    HALL[fk].rows.forEach((r, ri) => {
      let mn = Infinity, mx = -Infinity;
      r.segs.forEach(s => { mn = Math.min(mn, s[0]); mx = Math.max(mx, s[1]); });
      const y = (Yf(r.y) + 3.5).toFixed(1);
      g += `<text x="${(Xf(mn) - SQ / 2 - 18).toFixed(1)}" y="${y}" text-anchor="middle" class="row-num">${ri + 1}</text>`;
      g += `<text x="${(Xf(mx) + SQ / 2 + 18).toFixed(1)}" y="${y}" text-anchor="middle" class="row-num">${ri + 1}</text>`;
    });
  });

  // 区块标签（左/中/右，画在各层第一排上方）
  ['f1', 'f2'].forEach(fk => {
    const Xf = fk === 'f1' ? X1 : X2, Yf = fk === 'f1' ? Y1 : Y2;
    const b = fk === 'f1' ? b1 : b2;
    const cx = (b.xMin + b.xMax) / 2;
    const zx = { L: [Infinity, -Infinity], M: [Infinity, -Infinity], R: [Infinity, -Infinity] };
    HALL[fk].rows.forEach(r => r.segs.forEach(sg => {
      const z = zoneOfSeg(sg, cx);
      zx[z][0] = Math.min(zx[z][0], sg[0]); zx[z][1] = Math.max(zx[z][1], sg[1]);
    }));
    const labelY = Yf(b.yMin) - 20;
    Object.keys(zx).forEach(z => {
      if (!isFinite(zx[z][0])) return;
      g += `<text x="${Xf((zx[z][0] + zx[z][1]) / 2).toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" class="zone-label">${ZONE_NAMES[z]}</text>`;
    });
  });

  // 二楼分隔与标签
  g += `<line x1="${PAD - 22}" y1="${(f2Top - 44).toFixed(1)}" x2="${W - PAD + 22}" y2="${(f2Top - 44).toFixed(1)}" class="floor-sep"/>`;
  g += `<text x="${PAD - 26}" y="${(f2Top - 56).toFixed(1)}" class="floor-label">二楼 · 楼座</text>`;
  g += `<text x="${(W - PAD + 26).toFixed(1)}" y="${(f2Top - 56).toFixed(1)}" text-anchor="end" class="floor-note">阶梯收窄 · 前排护栏</text>`;

  // 底部图例（内嵌于 SVG，随导出/打印一起带走）
  const lg = [];
  res.classes.forEach(c => lg.push({ color: res.colorOf[c.id], name: c.name, n: c.count }));
  if (res.stats.leaderCount) lg.push({ color: COLOR_LEADER, name: '领导席', n: res.stats.leaderCount });
  if (res.stats.awardCount) lg.push({ color: COLOR_AWARD, name: '颁奖席', n: res.stats.awardCount });
  lg.push({ color: null, name: '空位', n: Math.max(res.stats.empty, 0) });

  const lgPer = 9, lgbx = 16, lgby = 13, lgLine = 20;
  const lgTop = H + 28;
  let lgg = `<line x1="${PAD - 22}" y1="${(H + 14).toFixed(1)}" x2="${W - PAD + 22}" y2="${(H + 14).toFixed(1)}" class="floor-sep"/>`;
  lg.forEach((it, i) => {
    const col = i % lgPer, row = Math.floor(i / lgPer);
    const sx = PAD + col * ((W - PAD * 2) / lgPer);
    const sy = lgTop + row * lgLine;
    lgg += `<rect x="${sx.toFixed(1)}" y="${(sy - lgby).toFixed(1)}" width="${lgbx}" height="${lgbx}" rx="3"${it.color ? ` fill="${it.color}"` : ''} class="lg-swatch${it.color ? '' : ' lg-empty'}"/>`;
    lgg += `<text x="${(sx + lgbx + 6).toFixed(1)}" y="${(sy - lgby + 12).toFixed(1)}" class="lg-text">${esc(it.name)} · ${it.n}</text>`;
  });
  const lgRows = Math.ceil(lg.length / lgPer);
  const H2 = Math.round(lgTop + lgRows * lgLine + 10);

  return `<svg viewBox="0 0 ${W} ${H2}" xmlns="http://www.w3.org/2000/svg" class="plan-svg" role="img" aria-label="礼堂座位平面图">${g}${lgg}</svg>`;
}

/* ---------- 图例 / 汇总 / 班级指引 ---------- */

export function buildLegendHTML(res) {
  const st = res.stats;
  let h = '';
  res.classes.forEach(c => {
    h += `<span class="lg-item"><i style="background:${res.colorOf[c.id]}"></i>${esc(c.name)}<b>${c.count}</b></span>`;
  });
  if (st.leaderCount) h += `<span class="lg-item"><i style="background:${COLOR_LEADER}"></i>领导席<b>${st.leaderCount}</b></span>`;
  if (st.awardCount) h += `<span class="lg-item"><i style="background:${COLOR_AWARD}"></i>颁奖席<b>${st.awardCount}</b></span>`;
  h += `<span class="lg-item"><i class="lg-empty"></i>空位<b>${st.empty >= 0 ? st.empty : 0}</b></span>`;
  return h;
}

const partText = p => `${p.row}排 ${pad2(p.from)}–${pad2(p.to)}号`;

export function buildSummaryHTML(res) {
  const st = res.stats;
  let rows = '';
  res.classes.forEach(c => {
    const floorName = c.floor === 'f1' ? '一楼' : '二楼';
    const zonesUsed = c.parts.length ? [...new Set(c.parts.map(p => p.zone))] : [];
    const loc = zonesUsed.length === 1 ? `${floorName}·${ZONE_NAMES[zonesUsed[0]]}` : floorName;
    const seatStr = c.parts.length
      ? c.parts.map(p => esc(partText(p))).join('<br>')
      : '<span class="miss">未排到座位</span>';
    const status = c.unseated > 0 ? `<span class="miss">差 ${c.unseated} 座</span>` : '✓';
    rows += `<tr><td>${esc(c.name)}</td><td>${esc(loc)}</td><td>${seatStr}</td><td>${c.seated}</td><td>${status}</td></tr>`;
  });
  rows += `<tr class="total"><td>合计 ${st.classCount} 个班</td><td></td><td>领导席 ${st.leaderCount} · 颁奖席 ${st.awardCount}</td><td>${st.seated}</td><td>${st.unseated > 0 ? `<span class="miss">${st.unseated} 人未排</span>` : '✓'}</td></tr>`;
  return `<table><thead><tr><th>班级</th><th>位置</th><th>座位安排</th><th>人数</th><th>状态</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export function buildGuideHTML(res, opts = {}) {
  let h = '';
  res.classes.forEach(c => {
    const floorName = c.floor === 'f1' ? '一楼' : '二楼';
    const lines = c.parts.map(p =>
      `<div class="gd-line"><span class="gd-row">${esc(floorName)} · ${esc(ZONE_NAMES[p.zone] || '')} · 第${p.row}排</span><span class="gd-seats">${pad2(p.from)} – ${pad2(p.to)} 号</span><span class="gd-n">${p.count} 人</span></div>`
    ).join('');
    let names = '';
    if (opts.granularity === 'student' && Array.isArray(c.names) && c.names.length) {
      const detail = [];
      c.parts.forEach(p => {
        for (let n = p.from; n <= p.to; n++) {
          const idx = detail.length;
          detail.push(`<tr><td>第${p.row}排</td><td>${pad2(n)}号</td><td>${esc(c.names[idx] || '')}</td></tr>`);
        }
      });
      names = `<table class="gd-table"><thead><tr><th>排</th><th>座号</th><th>姓名</th></tr></thead><tbody>${detail.join('')}</tbody></table>`;
    }
    h += `<div class="gd-card">
      <div class="gd-head"><span class="gd-name">${esc(c.name)}</span><span class="gd-count">${c.count} 人${c.unseated > 0 ? `（差 ${c.unseated} 座）` : ''}</span></div>
      ${lines || '<div class="gd-line"><span class="miss">未排到座位</span></div>'}
      ${names}
      <div class="gd-foot">按座位号从左到右、从前到后入座 · 班主任带队对号</div>
    </div>`;
  });
  return h || '<p class="hint">先在左侧填班级和人数。</p>';
}
