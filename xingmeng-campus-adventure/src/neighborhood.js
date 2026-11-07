/* The neighborhood owns its geometry, vehicle lifecycle and snack shop UI. */
(function (root) {
  'use strict';

  const W = root.CampusWorld;
  const gate = (m, z, width = 6.6) => {
    for (const side of [-1, 1]) {
      m.roundBox(side * (width / 2 + .45), 2.15, z, .9, 4.3, .9, .09, '#ba9d82');
      m.roundBox(side * (width / 2 + .45), 4.37, z, 1.1, .3, 1.1, .1, '#ddd1b9');
    }
    m.roundBox(0, 4.63, z, width + 1.9, .35, .72, .13, '#383b43');
    m.roundBox(0, 4.13, z, 3.1, .64, .24, .09, '#584a41');
  };

  function curb(m, z, color = '#ddd0bc') {
    m.box(0, .1, z, 90, .21, .33, color);
    for (let x = -43; x <= 43; x += 2.2) m.box(x, .207, z, .022, .009, .33, '#a7a194');
  }

  function wheel(m, radius, color = '#232731', spokes = 6) {
    const tube = radius * .15;
    const at = (a, b) => {
      const r = radius - tube + tube * Math.cos(b);
      return [tube * Math.sin(b), Math.sin(a) * r, Math.cos(a) * r];
    };
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12, next = (i + 1) * Math.PI / 12;
      for (let j = 0; j < 8; j++) {
        const b = j * Math.PI / 4, end = (j + 1) * Math.PI / 4;
        m.quad(at(a, b), at(a, end), at(next, end), at(next, b), color);
      }
    }
    m.sphere(0, 0, 0, radius * .21, '#87929a', 10, 7, [.8, 1, 1]);
    for (let j = 0; j < spokes; j++) {
      const a = j * Math.PI * 2 / spokes;
      const y = Math.sin(a) * radius * .82, z = Math.cos(a) * radius * .82;
      m.line([0, 0, 0], [0, y, z], radius * .028, '#a9b0ae');
    }
  }

  function bike(m) {
    const frame = '#34766d';
    const rear = [0, .52, -1.06], front = [0, .52, 1.06];
    const crank = [0, .56, -.12], seat = [0, 1.41, -.45], fork = [0, 1.41, .74];
    for (const [from, to] of [[rear, crank], [rear, seat], [crank, seat], [seat, fork], [fork, crank], [fork, front]]) {
      m.line(from, to, .055, frame);
    }
    m.line(fork, [0, 1.72, .78], .041, '#899a9a');
    m.line([-.35, 1.72, .78], [.35, 1.72, .78], .041, '#323d43');
    m.roundBox(0, 1.5, -.49, .24, .12, .43, .04, '#262e36');
    m.roundBox(0, 1.5, 1.02, .52, .38, .48, .08, '#af8f62');
    m.sphere(0, 1.2, .91, .11, '#f5d584', 12, 8);
    m.sphere(0, .81, -1.03, .085, '#ad4d4a', 12, 8);
  }

  function car(m) {
    m.roundBox(0, .59, 0, 2.65, .55, 4.42, .25, '#222c35', 7);
    m.roundBox(0, .93, 0, 2.74, .75, 4.44, .28, '#4a766e', 8);
    m.roundBox(0, 1.54, -.31, 2.32, 1, 2.52, .39, '#304f5a', 8);
    m.roundBox(0, 1.95, -.44, 2.18, .23, 1.8, .10, '#65897b', 6);
    m.roundBox(0, 1.32, 1.40, 2.51, .24, 1.04, .11, '#60887e', 5);
    for (const x of [-1.15, 1.15]) {
      m.roundBox(x, 1.52, -.29, .14, .46, 1.88, .067, '#668892', 4);
      m.box(x * 1.035, 1.51, -.34, .07, .55, .13, '#303e45');
      m.roundBox(x * 1.2, 1.45, .56, .37, .2, .31, .09, '#427467');
      m.roundBox(x * .85, .96, 2.17, .48, .24, .12, .05, '#efe3b6');
      m.roundBox(x * .85, .95, -2.17, .46, .19, .13, .05, '#b84c49');
      m.roundBox(x * 1.13, 1.14, -.64, .08, .09, .31, .035, '#a0adab');
    }
    m.roundBox(0, .75, 2.23, 1.29, .23, .1, .035, '#27363d');
    m.roundBox(0, .76, -2.24, .56, .24, .1, .04, '#dedacd');
  }

  function train(m) {
    for (const center of [-3, 3]) {
      m.roundBox(0, .68, center, 2.85, .63, 5.89, .28, '#404951', 5);
      m.roundBox(0, 1.88, center, 2.95, 2.37, 5.86, .38, '#dedbd0', 6);
      m.roundBox(0, 2.97, center, 2.73, .25, 5.42, .11, '#aab2ae', 5);
      for (const x of [-1.46, 1.46]) {
        m.box(x, 1.24, center, .065, .28, 5.28, '#447b78');
        for (const z of [-1.59, -.52, .55, 1.62]) {
          m.roundBox(x, 2.18, center + z, .08, .65, .88, .036, '#40606d', 4);
        }
        m.box(x * 1.03, 1.66, center + .04, .045, 1.77, .055, '#7c9292');
      }
    }
    for (const z of [-5.92, 5.92]) {
      m.roundBox(0, 2.2, z, 2.08, .85, .18, .08, '#354f5a', 5);
      for (const x of [-.84, .84]) m.sphere(x, 1.18, z, .16, '#fff0c7', 12, 8, [1, .8, .46]);
    }
    m.roundBox(0, 1.37, 0, 2.56, 1.43, .65, .22, '#485257');
  }

  function stall(m, shop, character) {
    const { x, color, items } = shop, z = 17.6;
    m.roundBox(x, .73, z, 5.8, 1.3, 2.25, .12, '#b38b63');
    m.roundBox(x, 1.4, z - .42, 6.02, .19, 2.58, .08, '#d7bc92');
    for (const dx of [-2.7, 2.7]) {
      m.cylinder(x + dx, 2.34, z + .42, .07, 2.05, '#625f57', 10);
      m.cylinder(x + dx, 2.34, z - 1.02, .07, 2.05, '#625f57', 10);
    }
    for (let i = 0; i < 9; i++) {
      const px = x + (i - 4) * .68;
      m.roundBox(px, 3.4, z -.42, .69, .23, 2.9, .095, i % 2 ? '#e5d3ad' : color, 3);
    }
    items.forEach((item, i) => {
      const px = x + (i ? 1 : -1);
      m.roundBox(px, 1.57, z - 1, 1.65, .14, .91, .06, '#c4a888');
      for (const dx of [-.49, 0, .49]) {
        for (const dz of [-.19, .19]) m.sphere(px + dx, 1.77, z - 1 + dz, .18, item.color, 12, 8, [1.16, .79, 1]);
      }
    });
    character(m, x, .11, z + 1.53, 317 + Math.abs(x), true, Math.PI);
  }

  function streetGeometry(m, { tree, lamp, bench, character }) {
    m.box(0, -.66, 3, 96, 1.2, 59, '#729481');
    m.box(0, -.06, -.25, 91, .14, 13.3, '#555b60');
    m.box(0, -.02, 10.15, 91, .16, 6, '#748a83');
    m.box(0, -.1, 24, 91, .19, 4.7, '#817e71');
    for (const [z, width] of [[-12, 10], [15.45, 4.5]]) {
      m.box(0, .025, z, 91, .17, width, '#c6bdac');
      for (let x = -44; x < 45; x += 2.25) m.box(x, .114, z, .022, .008, width, '#a6a397');
    }
    curb(m, -7);
    curb(m, 6.5);
    curb(m, 13.1);
    for (let x = -43; x <= 43; x += 5.5) {
      if (Math.abs(x) > 4) m.box(x, .025, -.12, 2.9, .022, .105, '#d6c89b');
      m.box(x, .075, 10.05, 2.55, .025, .075, '#d9e0cb');
    }
    for (let z = -6; z <= 6; z += 1.25) m.box(0, .035, z, 4.4, .029, .48, '#e4dfcd');
    for (let x = -44; x <= 44; x += 1.55) m.box(x, .04, 24, .24, .15, 3.38, '#695c51');
    for (const z of [23.06, 24.94]) m.box(0, .18, z, 92, .14, .13, '#989c95');
    for (const x of Object.values(W.TRAINS)) {
      m.roundBox(x, .29, 20.25, 13.4, .49, 3.1, .13, '#bcb7a8');
      m.box(x, .54, 21.5, 13.0, .04, .3, '#d3ae63');
      for (const dx of [-5.9, 5.9]) m.cylinder(x + dx, 2.16, 19.56, .09, 3.27, '#54626a', 12);
      m.roundBox(x, 3.92, 19.95, 13.3, .24, 2.87, .12, '#657b83', 5);
      bench(m, x, 19.8);
    }
    gate(m, W.GATE_Z);
    for (const side of [-1, 1]) {
      m.box(side * 24.2, .44, W.GATE_Z, 41.8, .88, .7, '#a88c74');
      for (let x = 5.7; x <= 44; x += 2.1) {
        m.box(side * x, 1.27, W.GATE_Z, .08, 1.17, .12, '#536263');
      }
      m.box(side * 24.2, 1.83, W.GATE_Z, 41.8, .10, .13, '#536263');
    }
    const treeXs = [-38, -28, -12, 13, 25, 38];
    treeXs.forEach((x, i) => {
      m.roundBox(x, .075, -13, 2.5, .14, 2.3, .07, '#776d56', 3);
      tree(m, x, -13, 1.15 + i % 3 * .17, i === 2);
      for (let j = 0; j < 4; j++) m.sphere(x - .9 + j * .58, .21, -12.19, .14, '#aeb680', 8, 6);
    });
    for (const x of [-42, -19, -4.7, 4.7, 18, 34, 42]) lamp(m, x, -8.2);
    for (const x of [-35, -23, -6, 13, 31]) bench(m, x, -11.1);
    for (const shop of W.SHOPS) stall(m, shop, character);
    // Low distant roofs frame the playable street without hiding the gates.
    for (const [i, x] of [-41, -32, -23, -15, 16, 25, 34, 43].entries()) {
      const h = 3.1 + i % 3 * 1.25;
      m.roundBox(x, h / 2, -25.5, 7.3, h, 5.9, .15, ['#a8a89b', '#bdad99', '#9caba4'][i % 3], 4);
      m.box(x, h + .14, -25.5, 7.65, .32, 6.3, '#6f7778');
      for (const dx of [-2.2, 0, 2.2]) m.box(x + dx, h * .67, -22.52, 1.07, 1.14, .1, '#728489');
    }
  }

  function create(api) {
    const { $, marker, getState, save, toast, fx, hud, dialog, closeDialog, Mesh } = api;
    let active = null, road, rail, elapsed, forwardHeld, models = {}, hudText = '', lastMode = null;
    const s = () => getState();

    function reset() {
      active = null;
      elapsed = 0;
      forwardHeld = false;
      road = Object.fromEntries(Object.entries(W.VEHICLES).map(([key, spec]) => [key, { ...spec.start, speed: 0, roll: 0 }]));
      rail = { x: W.TRAINS.west, z: W.TRACK_Z, station: 'west', heading: Math.PI / 2, speed: 0, destination: null };
      updateHud();
    }

    function build(m, add) {
      streetGeometry(m, api);
      const bind = (kind, label, id, x, y, z, callback, anchor) => {
        marker(kind, label, id, x, y, z, callback, anchor);
        add(label, callback);
      };
      bind('door', '🏫 返回学校街', 'school-street', -42, 2.1, 0, () => api.go('school-street'));
      bind('door', '🏡 沿街向东 · 我的家街', 'home-street', 42, 2.1, 0, () => api.go('home-street'));
      for (const [kind, spec] of Object.entries(W.VEHICLES)) {
        const label = kind === 'bike' ? '🚲 骑自行车' : '🚙 驾驶校园小车';
        bind('item', label, 'ride-' + kind, spec.start.x, 2.3, spec.start.z, () => mount(kind),
          () => ({ x: road[kind].x, y: kind === 'bike' ? 2.22 : 2.8, z: road[kind].z }));
      }
      for (const [station, x] of Object.entries(W.TRAINS)) {
        const name = station === 'west' ? '西站' : '东站';
        bind('door', '🚈 轻轨' + name, 'station-' + station, x, 4.45, 20, () => stationAction(station));
      }
      for (const shop of W.SHOPS) {
        bind('person', '🍡 ' + shop.name, 'stall-' + shop.id, shop.x, 3.75, 16.9, () => showShop(shop));
      }
      add('🎒 我的零食袋', showBag);
      return {
        title: '🍡 小吃摊街 · 放学街区',
        desc: '街西通学校街，街东通我的家街。可骑车、开车、乘轻轨，或在三个摊位用游戏金币买零食。',
        camera: { theta: .28, phi: .98, dist: 81, target: [0, 1.6, 4] }
      };
    }

    function gateAtCampus(m) {
      gate(m, 30);
      for (const side of [-1, 1]) {
        m.box(side * 6.5, .61, 30, 5.4, 1.22, .42, '#ae967d');
        for (let x = 4.7; x < 9.5; x += 1.1) m.box(side * x, 1.45, 30, .065, .73, .09, '#586566');
        m.box(side * 6.65, 1.82, 30, 5.55, .08, .12, '#586566');
      }
      m.box(0, -.07, 31.6, 6.7, .12, 5.1, '#c8beaa');
    }

    function prepare(make, drop) {
      Object.values(models).forEach(drop);
      models = {};
      if (s().scene !== 'street') return;
      const parts = {
        bike, car, train,
        bikeShadow: m => m.sphere(0,.063,0,1,'#67786d',18,7,[.46,.018,1.5]),
        carShadow: m => m.sphere(0,.024,0,1,'#41484b',22,8,[1.6,.016,2.4]),
        bikeWheel: m => wheel(m, .52, '#23282b', 10),
        carWheel: m => wheel(m, .54, '#262a31'),
        rider: m => {
          m.sphere(0, 1.93, -.2, .27, '#58746d', 16, 11, [1, 1.34, .85]);
          m.sphere(0, 2.3, -.03, .19, '#d4a280', 16, 12);
          m.sphere(0, 2.39, -.1, .21, '#394b61', 18, 12, [1.06, .64, 1.2]);
          for (const x of [-.19, .19]) {
            m.line([x, 1.98, -.17], [x * 1.47, 1.73, .73], .055, '#58746d');
            m.line([x * .74, 1.64, -.27], [x * 1.45, .98, .01], .085, '#3e4e62');
          }
        },
        child1: m => api.character(m, 0, 0, 0, 208),
        child2: m => api.character(m, 0, 0, 0, 221)
      };
      for (const [id, makePart] of Object.entries(parts)) {
        const mesh = new Mesh();
        makePart(mesh);
        models[id] = make(mesh);
      }
    }

    function transform(state, x, y, z) {
      const c = Math.cos(state.heading), d = Math.sin(state.heading);
      return [state.x + x * c + z * d, y, state.z - x * d + z * c];
    }

    function draw(drawPart) {
      if (!models.bike) return;
      for (const [key, v] of Object.entries(road)) {
        drawPart(models[key+'Shadow'], [v.x, 0, v.z], v.heading);
        drawPart(models[key], [v.x, 0, v.z], v.heading);
        if (key === 'bike') {
          for (const z of [-1.06, 1.06]) drawPart(models.bikeWheel, transform(v, 0, .52, z), v.heading, v.roll);
          if (active === 'bike') drawPart(models.rider, [v.x, 0, v.z], v.heading);
        } else {
          for (const x of [-1.3, 1.3]) {
            for (const z of [-1.39, 1.4]) drawPart(models.carWheel, transform(v, x, .53, z), v.heading, v.roll);
          }
        }
      }
      drawPart(models.train, [rail.x, .11, rail.z], rail.heading);
      for (const [i, model] of [models.child1, models.child2, models.child1].entries()) {
        const t = elapsed * 1.38 + i * 7.1;
        const along = t % 24;
        const x = (along < 12 ? along : 24 - along) + [-25, -4, 12][i];
        drawPart(model, [x, .13 + Math.abs(Math.sin(t * 4.4)) * .077, 14.15 + i % 2 * .84],
          along < 12 ? Math.PI / 2 : -Math.PI / 2);
      }
    }

    function mount(kind) {
      if (active === kind) return dismount();
      if (active) return toast('先停车下车，再换乘。');
      active = kind;
      api.rideCamera(28);
      api.clearInput();
      fx.click();
      updateHud();
      toast(kind === 'bike' ? '自行车已解锁 · W 蹬车，A/D 转向' : '已系好安全带 · W 加速，A/D 转向');
    }

    function stationAction(station) {
      if (active && active !== 'train') return toast('先停车下车，再乘轻轨。');
      if (rail.destination) return toast('列车正在行驶，请等它进站。');
      if (rail.station !== station) {
        if (active) return toast('请先下车，或乘车到下一站。');
        rail.destination = station;
        fx.click();
        toast('列车正在驶向本站，稍等片刻。');
        return;
      }
      if (active === 'train') return depart();
      active = 'train';
      api.rideCamera(39);
      api.clearInput();
      fx.click();
      updateHud();
      toast('已上车。按 W 或「发车」去另一站。');
    }

    function depart() {
      if (active !== 'train' || rail.destination) return;
      rail.destination = rail.station === 'west' ? 'east' : 'west';
      fx.click();
      updateHud();
      toast('车门已关闭，轻轨正在出站。');
    }

    function dismount() {
      if (!active) return true;
      if (active === 'train' && rail.destination) { toast('请等轻轨停稳再下车。'); return false; }
      const from = active === 'train' ? rail : road[active];
      if (from.speed > .65 || from.speed < -.65) { toast('先停车，再下车。'); return false; }
      s().px = from.x;
      s().pz = active === 'train' ? 19.4 : active === 'car' ? -8.3 : 14.1;
      active = null;
      api.rideCamera(68);
      api.clearInput();
      updateHud();
      save();
      return true;
    }

    function tick(dt, input) {
      elapsed += dt;
      if (active === 'bike' || active === 'car') {
        const old = road[active], next = W.stepVehicle(active, old, input, dt);
        const distance = Math.hypot(next.x - old.x, next.z - old.z);
        next.roll = (old.roll + Math.sign(next.speed || old.speed) * distance / .53) % (Math.PI * 2);
        road[active] = next;
      } else if (active === 'train' && input.throttle > 0 && !forwardHeld) {
        depart();
      }
      forwardHeld = input.throttle > 0;
      const moving = !!rail.destination;
      rail = W.stepTrain(rail, dt);
      if (moving && !rail.destination) {
        fx.success();
        toast('🚈 轻轨已到' + (rail.station === 'west' ? '西站' : '东站') + '。');
      }
      updateHud();
    }

    function updateHud() {
      const panel = $('ridePanel');
      if (!panel) return;
      panel.classList.toggle('hidden', !active);
      if (!active) { lastMode = null; return; }
      const trainMode = active === 'train', speed = trainMode ? rail.speed : road[active].speed;
      const name = trainMode ? '轻轨' : W.VEHICLES[active].name;
      const text = name + ' · ' + (Math.abs(speed) < .1 ? '已停车' : Math.round(Math.abs(speed) * 3.6) + ' km/h');
      if (text !== hudText) $('rideSpeed').textContent = hudText = text;
      if (active !== lastMode) {
        $('rideTip').textContent = trainMode ? '停站后可下车' : 'W 加速 · S 倒车 · A/D 转向';
        $('rideBrake').classList.toggle('hidden', trainMode);
        lastMode = active;
      }
      $('rideDepart').classList.toggle('hidden', !trainMode || Boolean(rail.destination));
      $('rideLeave').disabled = trainMode ? Boolean(rail.destination) : Math.abs(speed) > .65;
    }

    function showShop(shop) {
      if (active && !dismount()) return;
      function render() {
        dialog('🍡 ' + shop.name, `<p class="sm">放学啦！挑一份喜欢的小吃。可用游戏金币 <b>🪙 ${s().coin}</b></p>
          <div class="snack-menu">${shop.items.map(item =>
            `<button class="btn" data-snack="${item.id}" ${s().coin < item.price || s().snacks[item.id] >= 99 ? 'disabled' : ''}>
            <span>${item.icon} ${item.name}</span><b>${item.price} 金币</b></button>`).join('')}</div>
          <button class="btn full" id="openSnackBag">🎒 打开零食袋</button>`);
        $('openSnackBag').onclick = showBag;
        $('dBody').querySelectorAll('[data-snack]').forEach(button => {
          button.onclick = () => {
            const id = button.dataset.snack, bought = W.buySnack(s().coin, s().snacks, id);
            if (!bought) return;
            Object.assign(s(), bought);
            save();
            hud();
            fx.coin();
            toast('已购买 ' + W.ITEMS[id].name + '，放进零食袋啦。');
            render();
          };
        });
      }
      render();
    }

    function showBag() {
      const owned = Object.values(W.ITEMS).filter(item => s().snacks[item.id] > 0);
      dialog('🎒 我的零食袋', `<p class="sm">点一下喜欢的小吃，和放学回家的小探险家一起尝尝。</p>
        <div class="snack-menu">${owned.length ? owned.map(item =>
          `<button class="btn" data-eat="${item.id}"><span>${item.icon} ${item.name}</span><b>× ${s().snacks[item.id]}</b></button>`).join('')
          : '<p class="sm">零食袋空空的。可以到放学街区的小吃摊购买。</p>'}</div>
        <button class="btn full" id="closeSnackBag">继续探险</button>`);
      $('closeSnackBag').onclick = closeDialog;
      $('dBody').querySelectorAll('[data-eat]').forEach(button => {
        button.onclick = () => {
          const id = button.dataset.eat;
          if (s().snacks[id] <= 0) return;
          s().snacks[id]--;
          save();
          fx.success();
          toast('尝了一口 ' + W.ITEMS[id].name + '！');
          showBag();
        };
      });
    }

    return {
      reset, build, gateAtCampus, prepare, draw, tick, dismount, depart, showBag,
      active: () => active,
      anchor: () => active === 'train' ? rail : active ? road[active] : null
    };
  }

  root.CampusNeighborhood = { create };
})(globalThis);
