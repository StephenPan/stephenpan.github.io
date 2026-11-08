/* One validation path for browser saves, migrations and exported save files. */
(function (root) {
  'use strict';

  const HOUR = 3600000;
  const KEY = 'star-dream-3d-v8';
  const KEYS = [KEY, 'star-dream-3d-v7', 'star-dream-3d-v6', 'star-dream-3d-v5', 'star-dream-3d-v4'];
  const STONE_CLASSES = [4, 9, 15, 22];
  const text = (value, limit = 500) => typeof value === 'string' && value.length <= limit;
  const count = (value, max, fallback = 0) =>
    Number.isSafeInteger(value) && value >= 0 ? Math.min(value, max) : fallback;
  const strings = (value, limit = 300) =>
    Array.isArray(value) ? [...new Set(value.filter(v => text(v, 70)))].slice(0, limit) : [];
  const flagsOf = (value, keys) => Object.fromEntries(keys.flatMap(key =>
    Number.isSafeInteger(value?.[key]) && value[key] >= 0 ? [[key, Math.min(value[key], 6)]] : []));

  function quizPlan(plan, idx, length) {
    if (!plan || plan.idx !== idx || !Array.isArray(plan.questions) || plan.questions.length !== length) return null;
    const questions = plan.questions.map(item => {
      if (!item || !['cn', 'ma', 'sci'].includes(item.type) || !text(item.id, 100) ||
          !text(item.topic, 70) || ![1, 2, 3].includes(item.diff) || !Array.isArray(item.q)) return null;
      const [question, options, correct, explanation] = item.q;
      if (!text(question) || !text(explanation) || !Array.isArray(options) || options.length !== 4 ||
          !options.every(v => text(v, 200)) || new Set(options).size !== 4 ||
          !Number.isInteger(correct) || correct < 0 || correct > 3) return null;
      return { id: item.id, type: item.type, topic: item.topic, diff: item.diff, q: [question, options, correct, explanation] };
    });
    if (questions.includes(null)) return null;
    return { idx, questions, progress: count(plan.progress, length - 1), mistakes: count(plan.mistakes, 99) };
  }

  function profile(raw) {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const learning = root.CampusLearning.ensureProfile({ ...source });
    const record = item => item && typeof item === 'object' &&
      text(item.id, 100) && text(item.question) && text(item.explain);
    learning.records = learning.records.filter(record);
    learning.mistakes = learning.mistakes.filter(record);
    learning.total = count(learning.total, 1000000);
    for (const subject of Object.values(learning.subjects)) {
      subject.level = Math.floor(subject.level);
      subject.solved = count(subject.solved, 1000000);
      subject.firstTry = count(subject.firstTry, subject.solved);
    }
    learning.elements = strings(source.elements, 8);
    delete learning.activeHourly;
    delete learning.activeClass;
    delete learning.classPlans;
    return learning;
  }

  function normalize(value, isScene, now = Date.now()) {
    const raw = value && typeof value === 'object' ? value : {};
    const round = count(raw.round, 100000, 1) || 1;
    const scene = isScene(raw.scene) ? raw.scene : 'campus';
    const locked = typeof raw.locked === 'boolean' ? raw.locked : true;
    const learning = profile(raw.learning);
    const hourly = locked && quizPlan(raw.learning?.activeHourly, round, 12);
    if (hourly) learning.activeHourly = hourly;
    const classPlans = {};
    const savedPlans = raw.learning?.classPlans;
    for (let c = 1; c <= 22; c++) {
      const old = raw.learning?.activeClass;
      const plan = quizPlan(savedPlans?.[c] ?? (old?.idx === c ? old : null), c, 8);
      if (plan) classPlans[c] = plan;
    }
    learning.classPlans = classPlans;
    const districtSpawn = scene === root.CampusBellRoom.ID ? root.CampusBellRoom.SPAWN : root.CampusDistricts.spawn(scene);
    const spawn = districtSpawn || (scene === 'street' ? root.CampusWorld.STREET_SPAWN : { x:0,z:8 });
    const cave = root.CampusDistricts.caves.find(c => c.id === scene);
    const validCavePosition = !cave || root.CampusDistricts.cavePassable(cave,raw.px,raw.pz);
    const limits = scene === root.CampusBellRoom.ID ? root.CampusBellRoom.BOUNDS :
      scene === 'street' ? root.CampusWorld.PATH_LIMITS : root.CampusDistricts.bounds(scene) ||
      {minX:scene === 'campus' ? -44 : scene.startsWith('floor-') ? -42 : -10.5,
       maxX:scene === 'campus' ? 44 : scene.startsWith('floor-') ? 42 : 10.5,
       minZ:scene === 'campus' ? -32 : -7,maxZ:scene === 'campus' ? 34 : 8};
    const coordinate = (n, fallback, min, max) =>
      Number.isFinite(n) ? Math.min(max,Math.max(min,n)) : fallback;
    const floor = scene.startsWith('class-') ? (Number(scene.slice(6)) > 11 ? 2 : 1) :
      scene.startsWith('floor-') ? Number(scene.slice(6)) : raw.floor === 2 ? 2 : 1;
    return {
      version: 8,
      avatar: raw.avatar === 1 ? 1 : 0,
      scene, floor, round, locked,
      progress: hourly ? count(raw.progress, 11) : 0,
      due: Number.isFinite(raw.due) ? Math.min(now + HOUR, raw.due) : now + HOUR,
      star: count(raw.star, 100000000),
      coin: count(raw.coin, 100000000),
      stamps: Array.isArray(raw.stamps) ? [...new Set(raw.stamps.filter(v => Number.isInteger(v) && v >= 1 && v <= 22))] : [],
      eggs: strings(raw.eggs), visits: strings(raw.visits), talk: strings(raw.talk), flags: strings(raw.flags),
      graduated: raw.graduated === true,
      audio: raw.audio === true,
      px: coordinate(validCavePosition ? raw.px : NaN, spawn.x, limits.minX, limits.maxX),
      pz: coordinate(validCavePosition ? raw.pz : NaN, spawn.z, limits.minZ, limits.maxZ),
      learning, snacks: root.CampusWorld.cleanSnacks(raw.snacks),
      stoneQuizProgress: flagsOf(raw.stoneQuizProgress, STONE_CLASSES),
      secretMonsterProgress: count(raw.secretMonsterProgress, 3),
      secretBossProgress: count(raw.secretBossProgress, 8)
    };
  }

  function read(storage, isScene) {
    for (const key of KEYS) {
      try {
        const value = JSON.parse(storage.getItem(key) || 'null');
        if (value && Number.isInteger(value.version) && value.version >= 4 && value.version <= 8) {
          return normalize(value, isScene);
        }
      } catch {
        // A damaged newer entry must not hide a usable older save.
      }
    }
    return normalize(null, isScene);
  }

  function importFile(file, isScene) {
    if (file?.format !== 'xingmeng-save-v1' || file.schema !== 1 || !file.state ||
        !Number.isSafeInteger(file.state.round) || file.state.round < 1 || file.state.round > 100000) {
      throw new Error('不是有效的星梦校园存档');
    }
    return normalize(file.state, isScene);
  }

  root.CampusSave = { KEY, HOUR, read, importFile, normalize };
})(globalThis);
