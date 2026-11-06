const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const keys = new Set();
let lastTime = 0;
let game;

const ui = {
  startPanel: document.querySelector("#startPanel"),
  levelPanel: document.querySelector("#levelUpPanel"),
  chestPanel: document.querySelector("#chestPanel"),
  pausePanel: document.querySelector("#pausePanel"),
  resultPanel: document.querySelector("#resultPanel"),
  characterOptions: document.querySelector("#characterOptions"),
  difficultyOptions: document.querySelector("#difficultyOptions"),
  weaponOptions: document.querySelector("#weaponOptions"),
  upgradeList: document.querySelector("#upgradeList"),
  chestReward: document.querySelector("#chestReward"),
  startButton: document.querySelector("#startButton"),
  chestButton: document.querySelector("#chestButton"),
  resumeButton: document.querySelector("#resumeButton"),
  againButton: document.querySelector("#againButton"),
  pauseButton: document.querySelector("#pauseButton"),
  soundButton: document.querySelector("#soundButton"),
  exitButton: document.querySelector("#exitButton"),
  time: document.querySelector("#timeText"),
  level: document.querySelector("#levelText"),
  kills: document.querySelector("#killText"),
  gold: document.querySelector("#goldText"),
  power: document.querySelector("#powerText"),
  hpBar: document.querySelector("#hpBar"),
  xpBar: document.querySelector("#xpBar"),
  hpText: document.querySelector("#hpText"),
  xpText: document.querySelector("#xpText"),
  buildList: document.querySelector("#buildList"),
  eventList: document.querySelector("#eventList"),
  sideCharacter: document.querySelector("#sideCharacter"),
  sideDifficulty: document.querySelector("#sideDifficulty"),
  bossBar: document.querySelector("#bossBar"),
  bossName: document.querySelector("#bossName"),
  bossHp: document.querySelector("#bossHp"),
  resultEyebrow: document.querySelector("#resultEyebrow"),
  resultTitle: document.querySelector("#resultTitle"),
  resultStats: document.querySelector("#resultStats"),
};

const selection = { character: "hunter", difficulty: "normal", weapon: "knife" };

const characters = {
  hunter: { name: "猎魔人", desc: "均衡角色，飞刀冷却更短。", hp: 112, speed: 170, pickup: 74, damage: 1.05, cooldown: 0.92, color: "#602536" },
  nun: { name: "修女", desc: "生命更高，圣焰范围更大。", hp: 136, speed: 156, pickup: 78, damage: 0.96, aura: 1.2, color: "#3d5b8c" },
  rogue: { name: "流浪者", desc: "移动最快，拾取更灵活。", hp: 94, speed: 194, pickup: 92, damage: 1.0, cooldown: 0.98, color: "#4d6b47" },
};

const difficulties = {
  normal: { name: "普通", desc: "标准 5 分钟试炼。", spawn: 1, hp: 1, speed: 1, gold: 1, bossAt: 150 },
  hard: { name: "困难", desc: "怪物更密，金币更多。", spawn: 1.22, hp: 1.18, speed: 1.08, gold: 1.35, bossAt: 130 },
  nightmare: { name: "噩梦", desc: "面试展示用高压模式。", spawn: 1.45, hp: 1.35, speed: 1.16, gold: 1.75, bossAt: 110 },
};

const startingWeapons = {
  knife: { name: "飞刀", desc: "自动瞄准最近敌人，稳定清怪。", apply: (p) => { p.weapons.knife.level = 1; } },
  aura: { name: "圣焰", desc: "近身持续伤害，容错更高。", apply: (p) => { p.weapons.aura.level = 1; p.weapons.aura.radius += 12; } },
  lightning: { name: "雷印", desc: "定期劈落闪电，适合处理远处目标。", apply: (p) => { p.weapons.lightning.level = 1; } },
};

const enemyTypes = {
  bat: { name: "夜蝠", hp: 26, speed: 96, damage: 8, xp: 5, gold: 1, size: 16, color: "#7b5bbd", weight: 8 },
  ghoul: { name: "腐尸", hp: 48, speed: 68, damage: 12, xp: 8, gold: 2, size: 20, color: "#6da851", weight: 6 },
  skull: { name: "骷髅兵", hp: 76, speed: 60, damage: 15, xp: 12, gold: 3, size: 20, color: "#d6d1b5", weight: 3 },
  brute: { name: "血肉巨怪", hp: 170, speed: 44, damage: 24, xp: 26, gold: 9, size: 30, color: "#c44d4d", weight: 1 },
};

const upgradePool = [
  { id: "knifePower", icon: "K", title: "飞刀精通", desc: "飞刀伤害 +24%，弹速 +8%。", max: 6, apply: (p) => { p.weapons.knife.level++; p.weapons.knife.damage *= 1.24; p.weapons.knife.speed *= 1.08; } },
  { id: "knifeTempo", icon: "T", title: "冷却压缩", desc: "飞刀冷却 -14%，每 3 级额外 +1 发。", max: 6, apply: (p) => { p.weapons.knife.level++; p.weapons.knife.cooldown *= 0.86; if (p.weapons.knife.level % 3 === 0) p.weapons.knife.amount++; } },
  { id: "aura", icon: "A", title: "圣焰光环", desc: "提升圣焰范围和持续伤害。", max: 6, apply: (p) => { p.weapons.aura.level++; p.weapons.aura.damage *= 1.28; p.weapons.aura.radius += 8; } },
  { id: "orbit", icon: "O", title: "回旋符文", desc: "增加一颗环绕符文。", max: 5, apply: (p) => { p.weapons.orbit.level++; p.weapons.orbit.amount++; p.weapons.orbit.damage *= 1.17; } },
  { id: "lightning", icon: "L", title: "雷印", desc: "闪电数量 +1，伤害提升。", max: 5, apply: (p) => { p.weapons.lightning.level++; p.weapons.lightning.amount++; p.weapons.lightning.damage *= 1.22; } },
  { id: "magnet", icon: "M", title: "磁石斗篷", desc: "拾取范围 +36%，宝石吸附速度 +15%。", max: 4, apply: (p) => { p.passives.magnet++; p.pickupRange *= 1.36; p.gemPull *= 1.15; } },
  { id: "move", icon: "S", title: "幽影步", desc: "移动速度 +12%，无敌时间略增。", max: 4, apply: (p) => { p.passives.move++; p.speed *= 1.12; p.invincibleTime += 0.04; } },
  { id: "vitality", icon: "V", title: "血瓶补给", desc: "生命上限 +24，并恢复 40 点。", max: 5, apply: (p) => { p.passives.vitality++; p.maxHp += 24; p.hp = Math.min(p.maxHp, p.hp + 40); } },
  { id: "greed", icon: "G", title: "金币诅咒", desc: "金币 +45%，敌人血量小幅提升。", max: 3, apply: (p) => { p.passives.greed++; p.goldBonus += 0.45; game.enemyHpBonus += 0.07; } },
];

const audio = { ctx: null, master: null, timer: null, enabled: true, beat: 0, next: 0, volume: 0.42 };

function makePlayer() {
  const c = characters[selection.character];
  const p = {
    x: 0, y: 0, face: 1, hp: c.hp, maxHp: c.hp, level: 1, xp: 0, nextXp: 24,
    speed: c.speed, pickupRange: c.pickup, gemPull: 260, invincible: 0, invincibleTime: 0.48,
    damageMult: c.damage || 1, color: c.color, goldBonus: 0,
    weapons: {
      knife: { name: "飞刀", level: 0, damage: 24, cooldown: 0.68 * (c.cooldown || 1), speed: 455, amount: 1, timer: 0 },
      aura: { name: "圣焰", level: 0, damage: 18, radius: 44 * (c.aura || 1) },
      orbit: { name: "符文", level: 0, damage: 16, amount: 0, radius: 62 },
      lightning: { name: "雷印", level: 0, damage: 54, amount: 1, cooldown: 2.5, timer: 1.2 },
    },
    passives: { magnet: 0, move: 0, vitality: 0, greed: 0 },
  };
  startingWeapons[selection.weapon].apply(p);
  if (p.weapons.knife.level === 0 && selection.weapon !== "knife") p.weapons.knife.level = 1;
  return p;
}

function resetGame(toMenu = true) {
  game = {
    state: toMenu ? "menu" : "playing",
    time: 0, kills: 0, gold: 0, chests: 0, enemyHpBonus: 0, spawnTimer: 0,
    bossSpawned: false, reaperSpawned: false, camera: { x: 0, y: 0 },
    enemies: [], gems: [], projectiles: [], particles: [], texts: [], pickups: [], events: [], history: [],
    pendingChest: null, player: makePlayer(),
  };
  updateHud();
}

function startGame() {
  initAudio();
  hideAllPanels();
  resetGame(false);
  logEvent(`${characters[selection.character].name} 进入血月试炼`);
  logEvent(`初始武器：${startingWeapons[selection.weapon].name}`);
  startMusic();
}

function hideAllPanels() {
  [ui.startPanel, ui.levelPanel, ui.chestPanel, ui.pausePanel, ui.resultPanel].forEach((el) => el.classList.add("hidden"));
}

function exitToMenu() {
  stopMusic();
  resetGame(true);
  hideAllPanels();
  ui.startPanel.classList.remove("hidden");
}

function pauseGame() {
  if (game.state === "playing") {
    game.state = "paused";
    ui.pausePanel.classList.remove("hidden");
  }
}

function resumeGame() {
  if (game.state === "paused") {
    game.state = "playing";
    ui.pausePanel.classList.add("hidden");
  }
}

function initSelection() {
  renderOptions(ui.characterOptions, characters, "character");
  renderOptions(ui.difficultyOptions, difficulties, "difficulty");
  renderOptions(ui.weaponOptions, startingWeapons, "weapon");
}

function renderOptions(container, data, key) {
  container.innerHTML = Object.entries(data).map(([id, item]) => (
    `<button class="choice-card ${selection[key] === id ? "active" : ""}" data-key="${key}" data-id="${id}" type="button">
      <strong>${item.name}</strong><small>${item.desc}</small>
    </button>`
  )).join("");
}

function selectOption(key, id) {
  selection[key] = id;
  initSelection();
  updateHud();
}

function formatTime(total) {
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${Math.floor(total % 60).toString().padStart(2, "0")}`;
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function rand(min, max) { return Math.random() * (max - min) + min; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) || 1; }

function chooseWeighted(options) {
  const total = options.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of options) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return options[0];
}

function updateHud() {
  const p = game.player;
  ui.time.textContent = formatTime(game.time);
  ui.level.textContent = p.level;
  ui.kills.textContent = game.kills;
  ui.gold.textContent = game.gold;
  ui.power.textContent = Object.values(p.weapons).reduce((s, w) => s + w.level, 0) + Object.values(p.passives).reduce((s, v) => s + v, 0);
  ui.hpText.textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
  ui.xpText.textContent = `${p.xp}/${p.nextXp}`;
  ui.hpBar.style.width = `${clamp(p.hp / p.maxHp, 0, 1) * 100}%`;
  ui.xpBar.style.width = `${clamp(p.xp / p.nextXp, 0, 1) * 100}%`;
  ui.sideCharacter.textContent = characters[selection.character].name;
  ui.sideDifficulty.textContent = difficulties[selection.difficulty].name;

  const build = [
    ["飞刀", p.weapons.knife.level], ["圣焰", p.weapons.aura.level], ["符文", p.weapons.orbit.level], ["雷印", p.weapons.lightning.level],
    ["磁石", p.passives.magnet], ["移速", p.passives.move], ["生命", p.passives.vitality], ["金币", p.passives.greed],
  ].filter(([, level]) => level > 0);
  ui.buildList.innerHTML = build.map(([name, level]) => `<li><span>${name}</span><b>Lv.${level}</b></li>`).join("");
  ui.eventList.innerHTML = game.events.slice(0, 5).map((e) => `<li>${e}</li>`).join("");

  const boss = game.enemies.find((e) => e.boss);
  if (boss) {
    ui.bossName.textContent = boss.name;
    ui.bossHp.style.width = `${clamp(boss.hp / boss.maxHp, 0, 1) * 100}%`;
    ui.bossBar.classList.remove("hidden");
  } else {
    ui.bossBar.classList.add("hidden");
  }
}

function logEvent(text) {
  game.events.unshift(`${formatTime(game.time)} ${text}`);
  game.events = game.events.slice(0, 8);
}

function spawnEnemy(typeName, boss = false) {
  const p = game.player;
  const diff = difficulties[selection.difficulty];
  const base = enemyTypes[typeName];
  const angle = rand(0, Math.PI * 2);
  const minute = game.time / 60;
  const hpScale = (1 + minute * 0.42 + game.enemyHpBonus) * diff.hp;
  const speedScale = (1 + minute * 0.08) * diff.speed;
  const e = {
    type: typeName, name: base.name, x: p.x + Math.cos(angle) * rand(390, 520), y: p.y + Math.sin(angle) * rand(390, 520),
    size: base.size, hp: Math.round(base.hp * hpScale), maxHp: Math.round(base.hp * hpScale),
    speed: base.speed * speedScale, damage: base.damage, xp: base.xp, gold: base.gold, color: base.color, hitFlash: 0,
    elite: Math.random() < Math.min(0.04 + minute * 0.025, 0.18), boss,
  };
  if (e.elite) {
    e.name = `精英${e.name}`;
    e.size += 8; e.hp *= 2.6; e.maxHp = e.hp; e.damage += 8; e.xp *= 2.4; e.gold *= 4; e.color = "#d88945";
  }
  if (boss) {
    e.name = typeName === "reaper" ? "终局死神" : "血月领主";
    e.size = typeName === "reaper" ? 64 : 58;
    e.hp = typeName === "reaper" ? 2600 : 1800 + Math.floor(game.time * 8);
    e.maxHp = e.hp; e.speed = typeName === "reaper" ? 46 : 34; e.damage = typeName === "reaper" ? 44 : 34;
    e.xp = 140; e.gold = 90; e.color = typeName === "reaper" ? "#7846b8" : "#b9324a"; e.elite = false;
  }
  game.enemies.push(e);
}

function spawnWave(dt) {
  const diff = difficulties[selection.difficulty];
  const progress = Math.min(1, game.time / 300);
  const interval = Math.max(0.14, (0.72 - progress * 0.42) / diff.spawn);
  game.spawnTimer -= dt;
  while (game.spawnTimer <= 0) {
    const weights = [
      { type: "bat", weight: enemyTypes.bat.weight },
      { type: "ghoul", weight: enemyTypes.ghoul.weight + game.time / 80 },
      { type: "skull", weight: enemyTypes.skull.weight + Math.max(0, game.time - 45) / 90 },
      { type: "brute", weight: enemyTypes.brute.weight + Math.max(0, game.time - 105) / 120 },
    ];
    spawnEnemy(chooseWeighted(weights).type);
    if (Math.random() < 0.1 + progress * 0.2) spawnEnemy("bat");
    game.spawnTimer += interval;
  }
  if (!game.bossSpawned && game.time >= diff.bossAt) {
    game.bossSpawned = true; spawnEnemy("brute", true); sfx("boss"); logEvent("血月领主出现");
    addText(game.player.x, game.player.y - 70, "血月领主出现！", "#ffcf6b", 2.2);
  }
  if (!game.reaperSpawned && game.time >= 270) {
    game.reaperSpawned = true; spawnEnemy("reaper", true); sfx("boss"); logEvent("终局死神加入战斗");
  }
}

function movePlayer(dt) {
  const p = game.player;
  let dx = 0, dy = 0;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) dx--;
  if (keys.has("ArrowRight") || keys.has("KeyD")) dx++;
  if (keys.has("ArrowUp") || keys.has("KeyW")) dy--;
  if (keys.has("ArrowDown") || keys.has("KeyS")) dy++;
  const len = Math.hypot(dx, dy) || 1;
  if (dx || dy) {
    p.x += (dx / len) * p.speed * dt;
    p.y += (dy / len) * p.speed * dt;
    p.face = dx === 0 ? p.face : Math.sign(dx);
  }
}

function nearestEnemy() {
  let target = null, best = Infinity;
  for (const e of game.enemies) {
    const d = dist(game.player, e);
    if (d < best) { best = d; target = e; }
  }
  return target;
}

function updateWeapons(dt) {
  const p = game.player;
  if (p.weapons.knife.level > 0) {
    p.weapons.knife.timer -= dt;
    if (p.weapons.knife.timer <= 0) {
      const target = nearestEnemy();
      if (target) {
        for (let i = 0; i < p.weapons.knife.amount; i++) {
          const spread = (i - (p.weapons.knife.amount - 1) / 2) * 0.16;
          const angle = Math.atan2(target.y - p.y, target.x - p.x) + spread;
          game.projectiles.push({ type: "knife", x: p.x, y: p.y - 8, vx: Math.cos(angle) * p.weapons.knife.speed, vy: Math.sin(angle) * p.weapons.knife.speed, life: 1.18, damage: p.weapons.knife.damage * p.damageMult, pierce: p.weapons.knife.level >= 5 ? 1 : 0 });
        }
        sfx("knife");
      }
      p.weapons.knife.timer = p.weapons.knife.cooldown;
    }
  }

  if (p.weapons.lightning.level > 0) {
    p.weapons.lightning.timer -= dt;
    if (p.weapons.lightning.timer <= 0) {
      const targets = [...game.enemies].sort((a, b) => dist(p, a) - dist(p, b)).slice(0, p.weapons.lightning.amount);
      for (const e of targets) {
        damageEnemy(e, p.weapons.lightning.damage * p.damageMult);
        addParticle(e.x, e.y, "#73aee8", 28);
        addText(e.x, e.y - 20, "雷击", "#9fd1ff", 0.5);
      }
      if (targets.length) sfx("lightning");
      p.weapons.lightning.timer = p.weapons.lightning.cooldown;
    }
  }
}

function applyAura(dt) {
  const p = game.player;
  if (p.weapons.aura.level > 0) {
    for (const e of game.enemies) {
      if (dist(p, e) < p.weapons.aura.radius + e.size * 0.45) {
        damageEnemy(e, p.weapons.aura.damage * p.damageMult * dt);
        if (Math.random() < 0.15) addParticle(e.x, e.y, "#ff9d4d", 1);
      }
    }
  }
  const orbit = p.weapons.orbit;
  for (let i = 0; i < orbit.amount; i++) {
    const a = game.time * 4.2 + (i * Math.PI * 2) / orbit.amount;
    const ox = p.x + Math.cos(a) * orbit.radius;
    const oy = p.y + Math.sin(a) * orbit.radius;
    for (const e of game.enemies) if (Math.hypot(e.x - ox, e.y - oy) < e.size * 0.45 + 10) damageEnemy(e, orbit.damage * p.damageMult * dt * 5);
  }
}

function updateProjectiles(dt) {
  const alive = [];
  for (const shot of game.projectiles) {
    shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
    for (const e of game.enemies) {
      if (e.hp <= 0) continue;
      if (Math.hypot(shot.x - e.x, shot.y - e.y) < e.size * 0.52 + 7) {
        damageEnemy(e, shot.damage); sfx("hit"); addParticle(e.x, e.y, "#ffe08a", 8);
        if (shot.pierce > 0) shot.pierce--; else shot.life = 0;
        break;
      }
    }
    if (shot.life > 0) alive.push(shot);
  }
  game.projectiles = alive;
}

function updateEnemies(dt) {
  const p = game.player;
  p.invincible = Math.max(0, p.invincible - dt);
  for (const e of game.enemies) {
    const d = dist(e, p);
    const vx = (p.x - e.x) / d, vy = (p.y - e.y) / d;
    const wobble = Math.sin(game.time * 3 + e.x * 0.01) * (e.boss ? 0.08 : 0.18);
    e.x += (vx + wobble * vy) * e.speed * dt;
    e.y += (vy - wobble * vx) * e.speed * dt;
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    if (d < e.size * 0.45 + 12 && p.invincible <= 0) {
      p.hp -= e.damage; p.invincible = p.invincibleTime; sfx("hurt");
      addText(p.x, p.y - 28, `-${e.damage}`, "#ff7a66", 0.65);
      addParticle(p.x, p.y, "#ff7a66", 16);
    }
  }
}

function damageEnemy(e, amount) { e.hp -= amount; e.hitFlash = 0.08; }

function collectDeadEnemies() {
  const diff = difficulties[selection.difficulty];
  const alive = [];
  for (const e of game.enemies) {
    if (e.hp <= 0) {
      game.kills++;
      const gold = Math.ceil(e.gold * diff.gold * (1 + game.player.goldBonus));
      game.gold += gold;
      game.gems.push({ x: e.x, y: e.y, value: e.xp, size: e.boss ? 13 : 8, pull: false });
      if (e.elite || e.boss) {
        game.pickups.push({ type: "chest", x: e.x + rand(-18, 18), y: e.y + rand(-18, 18), size: 18 });
        logEvent(`${e.name} 掉落宝箱`);
      }
      if (Math.random() < 0.035) game.pickups.push({ type: "food", x: e.x, y: e.y, size: 14 });
      addText(e.x, e.y - 16, `+${gold}g`, "#ffcf6b", 0.8);
      addParticle(e.x, e.y, e.color, e.boss ? 44 : 18);
    } else alive.push(e);
  }
  game.enemies = alive;
}

function updateGems(dt) {
  const p = game.player;
  const keep = [];
  for (const gem of game.gems) {
    const d = Math.hypot(p.x - gem.x, p.y - gem.y);
    if (d < p.pickupRange) gem.pull = true;
    if (gem.pull) {
      gem.x += ((p.x - gem.x) / (d || 1)) * p.gemPull * dt;
      gem.y += ((p.y - gem.y) / (d || 1)) * p.gemPull * dt;
    }
    if (d < 22) gainXp(gem.value); else keep.push(gem);
  }
  game.gems = keep;
}

function updatePickups() {
  const p = game.player;
  const keep = [];
  for (const item of game.pickups) {
    if (Math.hypot(p.x - item.x, p.y - item.y) < 28) {
      if (item.type === "food") {
        p.hp = Math.min(p.maxHp, p.hp + 28); sfx("pickup"); addText(p.x, p.y - 28, "+28 HP", "#72c264", 0.8);
      } else openChest();
    } else keep.push(item);
  }
  game.pickups = keep;
}

function gainXp(amount) {
  const p = game.player;
  p.xp += amount; sfx("pickup");
  if (p.xp >= p.nextXp) {
    p.xp -= p.nextXp; p.level++; p.nextXp = Math.floor(22 + p.level * 9 + p.nextXp * 1.14);
    sfx("level"); showLevelUp();
  }
}

function showLevelUp() {
  game.state = "levelup";
  ui.upgradeList.innerHTML = "";
  getUpgradeChoices(3).forEach((item) => {
    const button = document.createElement("button");
    button.className = "upgrade-card";
    button.type = "button";
    button.innerHTML = `<span class="upgrade-icon">${item.icon}</span><span><span class="upgrade-title">${item.title}</span><span class="upgrade-desc">${item.desc}</span></span><span class="upgrade-level">Lv.${getUpgradeLevel(item.id)}/${item.max}</span>`;
    button.addEventListener("click", () => {
      item.apply(game.player); game.history.push(item.title); logEvent(`升级：${item.title}`);
      game.state = "playing"; ui.levelPanel.classList.add("hidden"); updateHud();
    });
    ui.upgradeList.appendChild(button);
  });
  ui.levelPanel.classList.remove("hidden");
}

function getUpgradeChoices(count) {
  return upgradePool.filter((u) => getUpgradeLevel(u.id) < u.max).sort(() => Math.random() - 0.5).slice(0, count);
}

function getUpgradeLevel(id) {
  const p = game.player;
  if (id === "knifePower" || id === "knifeTempo") return p.weapons.knife.level;
  if (id === "aura") return p.weapons.aura.level;
  if (id === "orbit") return p.weapons.orbit.level;
  if (id === "lightning") return p.weapons.lightning.level;
  return p.passives[id] || 0;
}

function openChest() {
  game.state = "chest";
  game.chests++;
  const reward = getUpgradeChoices(1)[0] || upgradePool[0];
  game.pendingChest = reward;
  ui.chestReward.innerHTML = `<strong>${reward.title}</strong><p>${reward.desc}</p><p>额外金币 +${20 + game.chests * 8}</p>`;
  ui.chestPanel.classList.remove("hidden");
  sfx("chest");
}

function claimChest() {
  if (game.pendingChest) {
    game.pendingChest.apply(game.player);
    game.history.push(`宝箱:${game.pendingChest.title}`);
    game.gold += 20 + game.chests * 8;
    logEvent(`宝箱获得：${game.pendingChest.title}`);
    game.pendingChest = null;
  }
  ui.chestPanel.classList.add("hidden");
  game.state = "playing";
}

function addParticle(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2), s = rand(30, 150);
    game.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, life: rand(0.25, 0.7), size: rand(2, 5) });
  }
}

function addText(x, y, text, color, life) { game.texts.push({ x, y, text, color, life, maxLife: life }); }

function updateFx(dt) {
  game.particles = game.particles.map((p) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + 120 * dt, life: p.life - dt })).filter((p) => p.life > 0);
  game.texts = game.texts.map((t) => ({ ...t, y: t.y - 24 * dt, life: t.life - dt })).filter((t) => t.life > 0);
}

function update(dt) {
  if (game.state !== "playing") return;
  game.time += dt;
  movePlayer(dt); spawnWave(dt); updateWeapons(dt); updateProjectiles(dt); updateEnemies(dt); applyAura(dt);
  collectDeadEnemies(); updateGems(dt); updatePickups(); updateFx(dt);
  game.camera.x = game.player.x - W / 2; game.camera.y = game.player.y - H / 2;
  if (game.player.hp <= 0) endGame(false);
  if (game.time >= 300) endGame(true);
  updateHud();
}

function endGame(win) {
  game.state = win ? "win" : "gameover";
  stopMusic(); sfx(win ? "win" : "dead");
  hideAllPanels();
  ui.resultEyebrow.textContent = win ? "Victory" : "Game Over";
  ui.resultTitle.textContent = win ? "试炼完成" : "挑战结束";
  ui.resultStats.innerHTML = [
    ["存活时间", formatTime(game.time)], ["击杀", game.kills], ["金币", game.gold], ["等级", game.player.level],
    ["宝箱", game.chests], ["构筑", game.history.slice(-4).join(" / ") || "基础武器"],
  ].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("");
  ui.resultPanel.classList.remove("hidden");
}

function sx(x) { return Math.round(x - game.camera.x); }
function sy(y) { return Math.round(y - game.camera.y); }

function draw() {
  drawMap(); drawGems(); drawPickups(); drawAura(); drawProjectiles(); drawEnemies(); drawPlayer(); drawFx(); drawAtmosphere();
  if (game.state === "menu") { ctx.fillStyle = "rgba(14,9,12,.45)"; ctx.fillRect(0, 0, W, H); }
}

function drawMap() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#11151b");
  sky.addColorStop(0.45, "#17201b");
  sky.addColorStop(1, "#101716");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  drawDistantMoon();
  const tile = 48, startX = Math.floor(game.camera.x / tile) * tile, startY = Math.floor(game.camera.y / tile) * tile;
  for (let y = startY - tile; y < game.camera.y + H + tile; y += tile) {
    for (let x = startX - tile; x < game.camera.x + W + tile; x += tile) {
      const h = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      ctx.fillStyle = h > 0.72 ? "#1d2a21" : h > 0.42 ? "#18241d" : "#151f1a";
      ctx.fillRect(sx(x), sy(y), tile, tile);
      if (h > 0.86) drawGrave(sx(x + 18), sy(y + 31), h);
      if (h < 0.08) drawGrass(sx(x + 12), sy(y + 31));
      if (h > 0.94) drawDeadTree(sx(x + 30), sy(y + 35));
    }
  }
}

function drawGrave(x, y, seed) {
  ctx.fillStyle = seed > 0.93 ? "#463b40" : "#3a3438";
  ctx.fillRect(x - 7, y - 15, 14, 18);
  ctx.fillRect(x - 4, y - 20, 8, 6);
  ctx.fillStyle = "#211a20";
  ctx.fillRect(x - 4, y - 11, 8, 2);
  ctx.fillRect(x - 1, y - 16, 2, 8);
}

function drawGrass(x, y) {
  ctx.fillStyle = "#263729";
  ctx.fillRect(x, y, 18, 7);
  ctx.fillStyle = "#314b35";
  ctx.fillRect(x + 3, y - 3, 3, 4);
  ctx.fillRect(x + 12, y - 2, 3, 3);
}

function drawDeadTree(x, y) {
  ctx.fillStyle = "#3c2630";
  ctx.fillRect(x - 3, y - 30, 6, 30);
  ctx.fillRect(x - 16, y - 22, 18, 5);
  ctx.fillRect(x + 1, y - 17, 17, 5);
  ctx.fillStyle = "#241821";
  ctx.fillRect(x - 5, y - 33, 10, 5);
}

function drawDistantMoon() {
  const moonX = Math.round(W - 132 - (game.camera.x * 0.015) % 80);
  const moonY = Math.round(72 - (game.camera.y * 0.01) % 30);
  ctx.fillStyle = "rgba(154, 45, 45, .18)";
  ctx.fillRect(moonX - 22, moonY - 22, 92, 92);
  ctx.fillStyle = "#b73836";
  ctx.fillRect(moonX, moonY, 48, 48);
  ctx.fillStyle = "rgba(255, 210, 155, .18)";
  ctx.fillRect(moonX + 8, moonY + 7, 13, 7);
  ctx.fillStyle = "#131016";
  ctx.fillRect(moonX - 80, moonY + 72, 34, 72);
  ctx.fillRect(moonX - 48, moonY + 52, 42, 92);
  ctx.fillRect(moonX - 6, moonY + 84, 30, 60);
  ctx.fillStyle = "#0c0a0f";
  ctx.fillRect(moonX - 38, moonY + 37, 12, 16);
  ctx.fillRect(moonX - 22, moonY + 37, 12, 16);
}

function drawPlayer() {
  const p = game.player, x = sx(p.x), y = sy(p.y);
  if (p.invincible > 0 && Math.floor(game.time * 20) % 2 === 0) return;
  ctx.fillStyle = "#09070a"; ctx.fillRect(x - 13, y + 12, 26, 5);
  ctx.fillStyle = "#171018"; ctx.fillRect(x - 11, y - 18, 22, 32);
  ctx.fillStyle = p.color; ctx.fillRect(x - 9, y - 10, 18, 23);
  ctx.fillStyle = "#2b1721"; ctx.fillRect(x - 12, y - 8, 5, 19); ctx.fillRect(x + 7, y - 8, 5, 19);
  ctx.fillStyle = "#e6bf86"; ctx.fillRect(x - 6, y - 21, 12, 10);
  ctx.fillStyle = "#1b1320"; ctx.fillRect(x - 11, y - 24, 22, 6);
  ctx.fillStyle = "#3b2330"; ctx.fillRect(x - 7, y - 30, 14, 8);
  ctx.fillStyle = "#ffd9a1"; ctx.fillRect(x + p.face * 2, y - 18, 3, 3);
  ctx.fillStyle = "#d9a85e"; ctx.fillRect(x - 3, y - 8, 6, 13);
  ctx.fillStyle = "#251623"; ctx.fillRect(x - 7, y + 13, 5, 8); ctx.fillRect(x + 2, y + 13, 5, 8);
}

function drawEnemies() {
  for (const e of [...game.enemies].sort((a, b) => a.y - b.y)) {
    const x = sx(e.x), y = sy(e.y), s = e.size;
    ctx.fillStyle = "#100b10"; ctx.fillRect(x - s / 2, y + s / 3, s, 5);
    ctx.fillStyle = e.hitFlash > 0 ? "#fff0c7" : e.color;
    if (e.type === "bat") {
      ctx.fillRect(x - 18, y - 5, 12, 7); ctx.fillRect(x + 6, y - 5, 12, 7);
      ctx.fillRect(x - 12, y - 1, 8, 6); ctx.fillRect(x + 4, y - 1, 8, 6);
      ctx.fillRect(x - 5, y - 8, 10, 13);
      ctx.fillStyle = "#180f1b"; ctx.fillRect(x - 2, y - 3, 2, 2); ctx.fillRect(x + 2, y - 3, 2, 2);
    } else if (e.type === "skull") {
      ctx.fillRect(x - 9, y - 15, 18, 18); ctx.fillRect(x - 6, y + 3, 12, 12);
      ctx.fillStyle = "#f0ead0"; ctx.fillRect(x - 5, y - 17, 10, 3);
      ctx.fillStyle = "#20191b"; ctx.fillRect(x - 5, y - 8, 4, 4); ctx.fillRect(x + 2, y - 8, 4, 4); ctx.fillRect(x - 2, y + 1, 4, 2);
    } else if (e.boss) {
      ctx.fillRect(x - 27, y - 34, 54, 58);
      ctx.fillStyle = "#6b1c2a"; ctx.fillRect(x - 33, y - 20, 10, 36); ctx.fillRect(x + 23, y - 20, 10, 36);
      ctx.fillStyle = "#ffcf6b"; ctx.fillRect(x - 20, y - 44, 40, 10); ctx.fillRect(x - 12, y - 52, 8, 10); ctx.fillRect(x + 4, y - 52, 8, 10);
      ctx.fillStyle = "#2a1117"; ctx.fillRect(x - 14, y - 16, 8, 8); ctx.fillRect(x + 6, y - 16, 8, 8); ctx.fillRect(x - 8, y + 8, 16, 5);
    } else if (e.type === "ghoul") {
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      ctx.fillStyle = "#2f4f35"; ctx.fillRect(x - 7, y - 13, 14, 8);
      ctx.fillStyle = "#1d281d"; ctx.fillRect(x - 5, y - 5, 4, 4); ctx.fillRect(x + 3, y - 5, 4, 4);
      ctx.fillStyle = "#4c6d48"; ctx.fillRect(x - 11, y + 2, 5, 12); ctx.fillRect(x + 6, y + 2, 5, 12);
    } else {
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      ctx.fillStyle = "#7b2e35"; ctx.fillRect(x - 11, y - 17, 22, 8);
      ctx.fillStyle = "#26151a"; ctx.fillRect(x - 5, y - 5, 4, 4); ctx.fillRect(x + 3, y - 5, 4, 4);
      ctx.fillStyle = "#4a1f25"; ctx.fillRect(x - 15, y, 6, 17); ctx.fillRect(x + 9, y, 6, 17);
    }
    if (e.elite) { ctx.strokeStyle = "#ffcf6b"; ctx.strokeRect(x - s / 2 - 2, y - s / 2 - 2, s + 4, s + 4); }
    if (e.hp < e.maxHp) { ctx.fillStyle = "#120b10"; ctx.fillRect(x - s / 2, y - s / 2 - 8, s, 4); ctx.fillStyle = "#d94f45"; ctx.fillRect(x - s / 2, y - s / 2 - 8, s * Math.max(0, e.hp / e.maxHp), 4); }
  }
}

function drawAura() {
  const p = game.player, x = sx(p.x), y = sy(p.y);
  if (p.weapons.aura.level > 0) { ctx.strokeStyle = "rgba(255,151,69,.42)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, p.weapons.aura.radius, 0, Math.PI * 2); ctx.stroke(); }
  const orbit = p.weapons.orbit;
  for (let i = 0; i < orbit.amount; i++) {
    const a = game.time * 4.2 + (i * Math.PI * 2) / orbit.amount;
    ctx.fillStyle = "#b879ff"; ctx.fillRect(Math.round(x + Math.cos(a) * orbit.radius - 5), Math.round(y + Math.sin(a) * orbit.radius - 5), 10, 10);
  }
}

function drawProjectiles() {
  for (const s of game.projectiles) {
    const x = sx(s.x), y = sy(s.y);
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(s.vy, s.vx));
    ctx.fillStyle = "#d9e6f2"; ctx.fillRect(-8, -2, 14, 4);
    ctx.fillStyle = "#73aee8"; ctx.fillRect(5, -1, 5, 2);
    ctx.restore();
  }
}

function drawGems() {
  for (const g of game.gems) {
    const x = sx(g.x), y = sy(g.y);
    ctx.fillStyle = g.value > 20 ? "#7ddcff" : "#77c56b"; ctx.fillRect(x - g.size / 2, y - g.size / 2, g.size, g.size);
    ctx.fillStyle = "#e7ffd1"; ctx.fillRect(x - 1, y - g.size / 2, 2, 2);
  }
}

function drawPickups() {
  for (const item of game.pickups) {
    const x = sx(item.x), y = sy(item.y);
    if (item.type === "chest") {
      ctx.fillStyle = "#3a1e12"; ctx.fillRect(x - 11, y - 8, 22, 18);
      ctx.fillStyle = "#b36a2c"; ctx.fillRect(x - 9, y - 10, 18, 18);
      ctx.fillStyle = "#d99035"; ctx.fillRect(x - 9, y - 10, 18, 7);
      ctx.fillStyle = "#ffe08a"; ctx.fillRect(x - 2, y - 3, 4, 6);
      ctx.fillStyle = "#5a2d18"; ctx.fillRect(x - 10, y - 1, 20, 3);
    } else {
      ctx.fillStyle = "#2f6a3a"; ctx.fillRect(x - 7, y - 7, 14, 14);
      ctx.fillStyle = "#72c264"; ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.fillStyle = "#e1ffd2"; ctx.fillRect(x - 2, y - 7, 4, 14); ctx.fillRect(x - 7, y - 2, 14, 4);
    }
  }
}

function drawFx() {
  for (const p of game.particles) { ctx.globalAlpha = clamp(p.life / 0.55, 0, 1); ctx.fillStyle = p.color; ctx.fillRect(sx(p.x), sy(p.y), p.size, p.size); ctx.globalAlpha = 1; }
  ctx.textAlign = "center"; ctx.font = "700 15px Microsoft YaHei, Arial";
  for (const t of game.texts) { ctx.globalAlpha = clamp(t.life / t.maxLife, 0, 1); ctx.fillStyle = "#120b10"; ctx.fillText(t.text, sx(t.x) + 2, sy(t.y) + 2); ctx.fillStyle = t.color; ctx.fillText(t.text, sx(t.x), sy(t.y)); ctx.globalAlpha = 1; }
}

function drawAtmosphere() {
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(7,4,7,.46)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  if (game.state === "playing" && game.time > 240) {
    ctx.globalAlpha = 0.08 + Math.sin(game.time * 7) * 0.03;
    ctx.fillStyle = "#d94f45";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

function initAudio() {
  if (audio.ctx) { if (audio.ctx.state === "suspended") audio.ctx.resume(); return; }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audio.ctx = new AudioContext(); audio.master = audio.ctx.createGain(); audio.master.gain.value = audio.enabled ? audio.volume : 0; audio.master.connect(audio.ctx.destination);
}

function setSoundEnabled(v) {
  audio.enabled = v; ui.soundButton.textContent = v ? "音效：开" : "音效：关";
  if (audio.master) audio.master.gain.setTargetAtTime(v ? audio.volume : 0, audio.ctx.currentTime, 0.02);
}

function playTone(freq, duration = 0.08, type = "square", volume = 0.28, when = 0, slideTo = null) {
  if (!audio.enabled) return; initAudio(); if (!audio.ctx || !audio.master) return;
  const t = audio.ctx.currentTime + when, osc = audio.ctx.createOscillator(), gain = audio.ctx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, t); if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  gain.gain.setValueAtTime(0.0001, t); gain.gain.exponentialRampToValueAtTime(volume, t + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain); gain.connect(audio.master); osc.start(t); osc.stop(t + duration + 0.02);
}

function sfx(name) {
  const map = {
    knife: () => playTone(520, 0.045, "square", 0.09, 0, 760),
    hit: () => playTone(180, 0.055, "sawtooth", 0.10, 0, 90),
    pickup: () => { playTone(740, 0.045, "triangle", 0.12); playTone(980, 0.055, "triangle", 0.09, 0.045); },
    level: () => [523, 659, 784, 1047].forEach((n, i) => playTone(n, 0.12, "square", 0.15, i * 0.07)),
    hurt: () => { playTone(150, 0.12, "sawtooth", 0.2, 0, 70); playTone(95, 0.16, "square", 0.12, 0.05); },
    boss: () => [196, 147, 110].forEach((n, i) => playTone(n, 0.26, "sawtooth", 0.16, i * 0.16)),
    chest: () => [392, 523, 659, 784, 1047].forEach((n, i) => playTone(n, 0.11, "triangle", 0.14, i * 0.055)),
    lightning: () => playTone(1100, 0.09, "sawtooth", 0.12, 0, 260),
    dead: () => playTone(82, 0.45, "sawtooth", 0.18, 0, 45),
    win: () => [523, 659, 784, 1047, 1319].forEach((n, i) => playTone(n, 0.16, "triangle", 0.16, i * 0.09)),
  };
  if (map[name]) map[name]();
}

function startMusic() {
  if (audio.timer) return; initAudio(); audio.beat = 0; audio.next = audio.ctx ? audio.ctx.currentTime : 0; audio.timer = window.setInterval(scheduleMusic, 80);
}

function stopMusic() { if (audio.timer) { window.clearInterval(audio.timer); audio.timer = null; } }

function scheduleMusic() {
  if (!audio.ctx || !audio.enabled || game.state === "menu") return;
  const notes = [220, 262, 294, 262, 220, 196, 220, 330, 294, 262, 220, 196, 175, 196, 220, 262];
  const harmony = [440, 392, 330, 392, 440, 392, 330, 294];
  const bass = [55, 55, 65, 55, 49, 49, 73, 65];
  while (audio.next < audio.ctx.currentTime + 0.24) {
    const step = audio.beat % notes.length, when = audio.next - audio.ctx.currentTime;
    playTone(notes[step], 0.11, "square", step % 4 === 0 ? 0.16 : 0.11, when);
    if (step % 4 === 2) playTone(harmony[(step / 2) % harmony.length], 0.09, "triangle", 0.08, when + 0.035);
    if (step % 2 === 0) playTone(bass[(step / 2) % bass.length], 0.18, "triangle", 0.14, when);
    if (step % 4 === 0) playTone(82, 0.035, "square", 0.08, when, 48);
    audio.beat++; audio.next += 0.16;
  }
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now; update(dt); draw(); requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  if (e.code === "KeyP") game.state === "playing" ? pauseGame() : resumeGame();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => keys.clear());
for (const button of document.querySelectorAll("[data-direction]")) {
  const direction = button.dataset.direction;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys.add(direction);
  });
  button.addEventListener("lostpointercapture", () => keys.delete(direction));
}
document.addEventListener("click", (e) => {
  const card = e.target.closest(".choice-card");
  if (card) selectOption(card.dataset.key, card.dataset.id);
});
ui.startButton.addEventListener("click", startGame);
ui.exitButton.addEventListener("click", exitToMenu);
ui.pauseButton.addEventListener("click", pauseGame);
ui.resumeButton.addEventListener("click", resumeGame);
ui.againButton.addEventListener("click", exitToMenu);
ui.chestButton.addEventListener("click", claimChest);
ui.soundButton.addEventListener("click", () => { initAudio(); setSoundEnabled(!audio.enabled); });

initSelection();
resetGame(true);
requestAnimationFrame(loop);
