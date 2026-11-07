/* Small, deterministic rules shared by the browser and the Node tests. */
(function (root) {
  'use strict';

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const TRAINS = { west: -31, east: 31 };
  const TRACK_Z = 24;
  const GATE_Z = -18;
  const STREET_SPAWN = { x: 0, z: -15 };
  const PATH_LIMITS = { minX: -43, maxX: 43, minZ: -19, maxZ: 20 };
  const BARRIERS = [
    { minX: -43, maxX: -3.3, minZ: -19, maxZ: -17.35 },
    { minX: 3.3, maxX: 43, minZ: -19, maxZ: -17.35 },
    { minX: -20, maxX: -14, minZ: 16, maxZ: 19 },
    { minX: 4, maxX: 10, minZ: 16, maxZ: 19 },
    { minX: 18, maxX: 24, minZ: 16, maxZ: 19 },
    ...[-38, -28, -12, 13, 25, 38].map(x => ({ minX: x - .55, maxX: x + .55, minZ: -13.55, maxZ: -12.45 }))
  ];
  const VEHICLES = {
    bike: { name: '自行车', max: 7.8, reverse: 2, acceleration: 6.3, brake: 9, turn: 2.5, radius: .75,
      start: { x: -8, z: 10, heading: Math.PI / 2 }, minZ: 7.5, maxZ: 12.8 },
    car: { name: '校园小车', max: 13, reverse: 3, acceleration: 6.8, brake: 12, turn: 1.6, radius: 1.5,
      start: { x: -21, z: -3.3, heading: Math.PI / 2 }, minZ: -6.3, maxZ: 5.8 }
  };
  const SHOPS = [
    { id: 'fruit', name: '春姨水果铺', x: -17, color: '#a66b45', items: [
      { id: 'apple', name: '苹果切片', icon: '🍎', price: 4, color: '#b54446' },
      { id: 'orange', name: '橘子杯', icon: '🍊', price: 5, color: '#de8d34' }
    ] },
    { id: 'bake', name: '阿乐烘焙摊', x: 7, color: '#426a83', items: [
      { id: 'bread', name: '小熊面包', icon: '🍞', price: 7, color: '#b47b49' },
      { id: 'cake', name: '小米糕', icon: '🍰', price: 6, color: '#dfd5aa' }
    ] },
    { id: 'warm', name: '放学热食摊', x: 21, color: '#778144', items: [
      { id: 'corn', name: '甜玉米', icon: '🌽', price: 6, color: '#dca644' },
      { id: 'potato', name: '烤红薯', icon: '🍠', price: 8, color: '#90604f' }
    ] }
  ];
  const ITEMS = Object.fromEntries(SHOPS.flatMap(shop => shop.items.map(item => [item.id, item])));

  function moveOnFoot(position, input, dt) {
    const scale = 9 * dt / (Math.hypot(input.x, input.z) || 1);
    const x = clamp(position.x + input.x * scale, PATH_LIMITS.minX, PATH_LIMITS.maxX);
    const z = clamp(position.z + input.z * scale, PATH_LIMITS.minZ, PATH_LIMITS.maxZ);
    const blocked = (px, pz) => BARRIERS.some(b =>
      px > b.minX - .27 && px < b.maxX + .27 && pz > b.minZ - .27 && pz < b.maxZ + .27);
    const nextX = blocked(x, position.z) ? position.x : x;
    return { x: nextX, z: blocked(nextX, z) ? position.z : z };
  }

  function stepVehicle(kind, state, input, dt) {
    const spec = VEHICLES[kind];
    const target = input.throttle > 0 ? spec.max : input.throttle < 0 ? -spec.reverse : 0;
    const braking = input.brake || state.speed * target < 0;
    const goal = input.brake ? 0 : target;
    const rate = braking ? spec.brake : input.throttle ? spec.acceleration : 2.5;
    const speed = state.speed + clamp(goal - state.speed, -rate * dt, rate * dt);
    const steer = Math.min(1, Math.abs(speed) / 2) * input.steer * spec.turn * dt * Math.sign(speed);
    const heading = (state.heading + steer) % (2 * Math.PI);
    const x = state.x + Math.sin(heading) * speed * dt;
    const z = state.z + Math.cos(heading) * speed * dt;
    // Length matters when a turning vehicle approaches a curb.
    const sideRoom = Math.abs(Math.cos(heading)) * spec.radius + .35;
    const nextX = clamp(x, -39 + spec.radius, 39 - spec.radius);
    const nextZ = clamp(z, spec.minZ + sideRoom, spec.maxZ - sideRoom);
    const hit = nextX !== x || nextZ !== z;
    return { x: nextX, z: nextZ, heading, speed: hit ? 0 : speed };
  }

  function stepTrain(state, dt) {
    if (!state.destination) return state;
    const end = TRAINS[state.destination];
    const remaining = Math.abs(end - state.x);
    if (remaining < .06 || remaining <= state.speed * dt) {
      return { ...state, x: end, speed: 0, station: state.destination, destination: null };
    }
    const direction = Math.sign(end - state.x);
    const target = Math.min(12, Math.sqrt(2 * 5.5 * remaining));
    const speed = state.speed + clamp(target - state.speed, -5.5 * dt, 3.1 * dt);
    return { ...state, x: state.x + direction * speed * dt, speed, heading: direction * Math.PI / 2 };
  }

  function cleanSnacks(raw) {
    return Object.fromEntries(Object.keys(ITEMS).map(id => [id,
      Number.isSafeInteger(raw?.[id]) ? clamp(raw[id], 0, 99) : 0]));
  }

  function buySnack(wallet, inventory, id) {
    const item = Object.hasOwn(ITEMS, id) ? ITEMS[id] : null;
    if (!item || !Number.isSafeInteger(wallet) || wallet < item.price || inventory[id] >= 99) return null;
    return { coin: wallet - item.price, snacks: { ...inventory, [id]: (inventory[id] || 0) + 1 } };
  }

  function stoneTuning(horns, profile) {
    const single = horns === 1;
    const base = single ? .72 : 1.55;
    const speed = base * (profile.calm ? .72 : profile.mode === 'challenge' ? 1.25 : 1);
    return { speed, wake: single ? 3.5 : 2.8, rise: single ? 2.7 : 1.85 };
  }

  root.CampusWorld = {
    TRAINS, TRACK_Z, GATE_Z, STREET_SPAWN, PATH_LIMITS, VEHICLES, SHOPS, ITEMS,
    moveOnFoot, stepVehicle, stepTrain, cleanSnacks, buySnack, stoneTuning
  };
})(globalThis);
