const DEFAULT_ROUNDS = 2;
const DEFAULT_PER_ROUND = 1;
const DEFAULT_INTRO_TEXT = '今天, 你就是C位';
const DEFAULT_INTRO_HIGHLIGHT = 'C位';
const STORAGE_KEY = 'auditorium-lottery-settings-v5';
const BACKGROUND_IMAGE = 'assets/bg.jpg';
const BGM_SRC = '';
const MAX_BACKGROUND_SIZE = 10 * 1024 * 1024;
const MAX_BGM_SIZE = 30 * 1024 * 1024;
const SMALL_SEAT_UPDATE_LIMIT = 8;
const SEAT_BATCH_CHUNK_SIZE = 200;
const SETTINGS_SAVE_DELAY = 220;

const SEAT_ROWS = [{"excelRow":10,"level":"一层","row":1,"segments":[[5,11],[16,28],[32,38]]},{"excelRow":11,"level":"一层","row":2,"segments":[[5,11],[16,28],[32,38]]},{"excelRow":12,"level":"一层","row":3,"segments":[[5,11],[15,28],[32,38]]},{"excelRow":13,"level":"一层","row":4,"segments":[[7,11],[15,28],[32,36]]},{"excelRow":14,"level":"一层","row":5,"segments":[[7,11],[15,29],[32,36]]},{"excelRow":15,"level":"一层","row":6,"segments":[[6,11],[15,29],[32,37]]},{"excelRow":16,"level":"一层","row":7,"segments":[[6,11],[15,29],[32,37]]},{"excelRow":17,"level":"一层","row":8,"segments":[[5,11],[14,29],[32,38]]},{"excelRow":18,"level":"一层","row":9,"segments":[[4,11],[14,29],[32,39]]},{"excelRow":19,"level":"一层","row":10,"segments":[[3,11],[14,30],[32,40]]},{"excelRow":20,"level":"一层","row":11,"segments":[[2,11],[14,30],[32,40]]},{"excelRow":21,"level":"一层","row":12,"segments":[[2,11],[14,30],[32,41]]},{"excelRow":22,"level":"一层","row":13,"segments":[[1,11],[13,30],[32,42]]},{"excelRow":23,"level":"一层","row":14,"segments":[[1,11],[13,30],[32,42]]},{"excelRow":24,"level":"一层","row":15,"segments":[[1,30],[32,42]]},{"excelRow":25,"level":"一层","row":16,"segments":[[1,30],[32,42]]},{"excelRow":26,"level":"一层","row":17,"segments":[[1,30],[32,42]]},{"excelRow":27,"level":"一层","row":18,"segments":[[1,42]]},{"excelRow":31,"level":"一层","row":19,"segments":[[2,41]]},{"excelRow":32,"level":"一层","row":20,"segments":[[2,41]]},{"excelRow":33,"level":"一层","row":21,"segments":[[2,41]]},{"excelRow":34,"level":"一层","row":22,"segments":[[2,41]]},{"excelRow":35,"level":"一层","row":23,"segments":[[2,41]]},{"excelRow":36,"level":"一层","row":24,"segments":[[2,41]]},{"excelRow":37,"level":"一层","row":25,"segments":[[2,41]]},{"excelRow":38,"level":"一层","row":26,"segments":[[2,41]]},{"excelRow":39,"level":"一层","row":27,"segments":[[2,20],[23,30],[32,41]]},{"excelRow":40,"level":"一层","row":28,"segments":[[2,10],[14,20],[23,29],[33,41]]},{"excelRow":41,"level":"一层","row":29,"segments":[[14,20],[23,29]]},{"excelRow":45,"level":"二层","row":1,"segments":[[2,41]]},{"excelRow":46,"level":"二层","row":2,"segments":[[2,41]]},{"excelRow":47,"level":"二层","row":3,"segments":[[2,41]]},{"excelRow":48,"level":"二层","row":4,"segments":[[2,41]]},{"excelRow":49,"level":"二层","row":5,"segments":[[2,41]]},{"excelRow":50,"level":"二层","row":6,"segments":[[2,41]]},{"excelRow":51,"level":"二层","row":7,"segments":[[3,41]]},{"excelRow":52,"level":"二层","row":8,"segments":[[3,10],[12,29],[33,41]]}];

const state = {
  candidates: [],
  candidateMap: new Map(),
  blocked: new Set(),
  winners: [],
  settings: {
    rounds: DEFAULT_ROUNDS,
    perRound: DEFAULT_PER_ROUND,
    secondFloorEnabled: true,
    introText: DEFAULT_INTRO_TEXT,
    introHighlight: DEFAULT_INTRO_HIGHLIGHT,
    backgroundDataUrl: '',
    backgroundName: '默认背景',
  },
  media: {
    bgmUrl: '',
    bgmObjectUrl: '',
    bgmName: '内置音乐',
  },
  seatMapRendered: false,
  seatNodes: [],
  seatNodeMap: new Map(),
  seatRenderToken: 0,
  winnerKeysCache: new Set(),
  winnerKeysDirty: true,
  settingsSaveTimer: null,
  poolDirty: false,
  statsDirty: false,
  buttonsDirty: false,
  pendingUiTimer: null,
  enabledCountCache: 0,
  blockedEnabledCountCache: 0,
  winnerCountCache: 0,
  availableCountCache: 0,
  countsDirty: true,
  settingsOpen: false,
  isDrawing: false,
  rollingTimer: null,
  flyingTimer: null,
  currentCandidate: null,
  currentPool: [],
  bgmEnabled: true,
  audioCtx: null,
  synthNodes: [],
  synthTimer: null,
};

const el = {
  stage: document.getElementById('stage'),
  halo: document.getElementById('halo'),
  introText: document.getElementById('introText'),
  rollingNumber: document.getElementById('rollingNumber'),
  winnerPanel: document.getElementById('winnerPanel'),
  winnerLabel: document.getElementById('winnerLabel'),
  winnerNumber: document.getElementById('winnerNumber'),
  resultList: document.getElementById('resultList'),
  resultItems: document.getElementById('resultItems'),
  roundBadge: document.getElementById('roundBadge'),
  flyingLayer: document.getElementById('flyingLayer'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  resetBtn: document.getElementById('resetBtn'),
  showResultsBtn: document.getElementById('showResultsBtn'),
  toast: document.getElementById('toast'),
  bgm: document.getElementById('bgm'),
  musicToggle: document.getElementById('musicToggle'),
  settingsToggle: document.getElementById('settingsToggle'),
  settingsPanel: document.getElementById('settingsPanel'),
  settingsClose: document.getElementById('settingsClose'),
  roundsInput: document.getElementById('roundsInput'),
  perRoundInput: document.getElementById('perRoundInput'),
  introTextInput: document.getElementById('introTextInput'),
  introHighlightInput: document.getElementById('introHighlightInput'),
  secondFloorInput: document.getElementById('secondFloorInput'),
  settingsPageTitle: document.getElementById('settingsPageTitle'),
  settingsPageTabBtn: document.getElementById('settingsPageTabBtn'),
  photoPageTabBtn: document.getElementById('photoPageTabBtn'),
  rangeLevelInput: document.getElementById('rangeLevelInput'),
  rangeStartRowInput: document.getElementById('rangeStartRowInput'),
  rangeStartColInput: document.getElementById('rangeStartColInput'),
  rangeEndRowInput: document.getElementById('rangeEndRowInput'),
  rangeEndColInput: document.getElementById('rangeEndColInput'),
  rangeExcludeBtn: document.getElementById('rangeExcludeBtn'),
  backgroundInput: document.getElementById('backgroundInput'),
  bgmInput: document.getElementById('bgmInput'),
  backgroundPickText: document.getElementById('backgroundPickText'),
  bgmPickText: document.getElementById('bgmPickText'),
  backgroundName: document.getElementById('backgroundName'),
  bgmName: document.getElementById('bgmName'),
  clearMediaBtn: document.getElementById('clearMediaBtn'),
  defaultModeBtn: document.getElementById('defaultModeBtn'),
  totalSeatCount: document.getElementById('totalSeatCount'),
  blockedSeatCount: document.getElementById('blockedSeatCount'),
  activeSeatCount: document.getElementById('activeSeatCount'),
  seatMap: document.getElementById('seatMap'),
  seatBoardWrap: document.querySelector('.seat-board-wrap'),
  particleCanvas: document.getElementById('particleCanvas'),
  fireworkCanvas: document.getElementById('fireworkCanvas'),
};

function seatKey(level, row, col) {
  return `${level}-${row}-${col}`;
}

function seatLabel(seat) {
  const prefix = seat.level === '二层' ? '二层 ' : '';
  return `${prefix}${seat.row}排, ${seat.col}座`;
}

function buildCandidates() {
  state.candidates = [];
  state.candidateMap.clear();
  SEAT_ROWS.forEach((rowInfo) => {
    rowInfo.segments.forEach(([start, end]) => {
      for (let col = start; col <= end; col += 1) {
        const seat = {
          level: rowInfo.level,
          row: rowInfo.row,
          col,
          excelRow: rowInfo.excelRow,
          key: seatKey(rowInfo.level, rowInfo.row, col),
        };
        state.candidates.push(seat);
        state.candidateMap.set(seat.key, seat);
      }
    });
  });
}

function clampNumber(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return;
    state.settings.rounds = clampNumber(saved.rounds, 1, 99, DEFAULT_ROUNDS);
    state.settings.perRound = clampNumber(saved.perRound, 1, 99, DEFAULT_PER_ROUND);
    state.settings.secondFloorEnabled = saved.secondFloorEnabled !== false;
    if (typeof saved.introText === 'string' && saved.introText.trim()) {
      state.settings.introText = saved.introText.trim().slice(0, 24);
    }
    if (typeof saved.introHighlight === 'string' && saved.introHighlight.trim()) {
      state.settings.introHighlight = saved.introHighlight.trim().slice(0, 16);
    }
    if (typeof saved.backgroundDataUrl === 'string') state.settings.backgroundDataUrl = saved.backgroundDataUrl;
    if (typeof saved.backgroundName === 'string' && saved.backgroundName) state.settings.backgroundName = saved.backgroundName;
    if (Array.isArray(saved.blocked)) {
      const validKeys = new Set(state.candidates.map((seat) => seat.key));
      state.blocked = new Set(saved.blocked.filter((key) => validKeys.has(key)));
    }
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveSettings() {
  const payload = {
    rounds: state.settings.rounds,
    perRound: state.settings.perRound,
    secondFloorEnabled: state.settings.secondFloorEnabled,
    introText: state.settings.introText,
    introHighlight: state.settings.introHighlight,
    blocked: [...state.blocked],
    backgroundDataUrl: state.settings.backgroundDataUrl,
    backgroundName: state.settings.backgroundName,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    state.settings.backgroundDataUrl = '';
    state.settings.backgroundName = '默认背景';
    payload.backgroundDataUrl = '';
    payload.backgroundName = '默认背景';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    showToast('背景图片较大, 已仅在当前页面生效');
  }
}

function scheduleSaveSettings() {
  clearTimeout(state.settingsSaveTimer);
  state.settingsSaveTimer = setTimeout(() => {
    state.settingsSaveTimer = null;
    saveSettings();
  }, SETTINGS_SAVE_DELAY);
}

function flushScheduledSettingsSave() {
  if (!state.settingsSaveTimer) return;
  clearTimeout(state.settingsSaveTimer);
  state.settingsSaveTimer = null;
  saveSettings();
}

function getWinnerKeys() {
  if (state.winnerKeysDirty) {
    state.winnerKeysCache = new Set(state.winners.flat().map((winner) => winner.key));
    state.winnerKeysDirty = false;
  }
  return state.winnerKeysCache;
}

function markWinnerKeysDirty() {
  state.winnerKeysDirty = true;
  state.countsDirty = true;
}

function isSeatLevelEnabled(seat) {
  return state.settings.secondFloorEnabled || seat.level !== '二层';
}

function getEnabledCandidates() {
  return state.candidates.filter(isSeatLevelEnabled);
}

function getAvailableCandidates() {
  const winnerKeys = getWinnerKeys();
  return state.candidates.filter((seat) => isSeatLevelEnabled(seat) && !state.blocked.has(seat.key) && !winnerKeys.has(seat.key));
}

function randomSeat(list = getAvailableCandidates()) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function pickWinners(list, count) {
  const pool = [...list];
  const winners = [];
  while (winners.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(index, 1)[0]);
  }
  return winners;
}

function roundText(index) {
  const names = ['第一轮', '第二轮', '第三轮', '第四轮', '第五轮', '第六轮', '第七轮', '第八轮', '第九轮', '第十轮'];
  return names[index] || `第${index + 1}轮`;
}

function formatWinnerGroup(winners) {
  return winners.map(seatLabel).join('　');
}

function updateStatsTextFromCache() {
  el.totalSeatCount.textContent = state.enabledCountCache;
  el.blockedSeatCount.textContent = state.blockedEnabledCountCache;
  el.activeSeatCount.textContent = state.enabledCountCache - state.blockedEnabledCountCache;
}

function recomputeSeatCounts() {
  const winnerKeys = getWinnerKeys();
  let enabledCount = 0;
  let blockedEnabledCount = 0;
  let availableCount = 0;

  state.candidates.forEach((seat) => {
    if (!isSeatLevelEnabled(seat)) return;
    enabledCount += 1;
    const isBlocked = state.blocked.has(seat.key);
    if (isBlocked) blockedEnabledCount += 1;
    if (!isBlocked && !winnerKeys.has(seat.key)) availableCount += 1;
  });

  state.enabledCountCache = enabledCount;
  state.blockedEnabledCountCache = blockedEnabledCount;
  state.winnerCountCache = winnerKeys.size;
  state.availableCountCache = availableCount;
  state.countsDirty = false;
  state.statsDirty = false;
  updateStatsTextFromCache();
}

function updateButtonsFast() {
  if (state.countsDirty) recomputeSeatCounts();
  const isFinished = state.winners.length >= state.settings.rounds;
  const remainingSeatsNeeded = Math.max(0, state.settings.rounds - state.winners.length) * state.settings.perRound;
  el.startBtn.disabled = state.isDrawing || isFinished || state.availableCountCache < remainingSeatsNeeded;
  el.stopBtn.disabled = !state.isDrawing;
  el.resetBtn.disabled = state.isDrawing && state.winners.length === 0;
  state.buttonsDirty = false;
}

function updateButtons() {
  updateButtonsFast();
}

function updateResults(options = {}) {
  el.resultItems.innerHTML = '';
  state.winners.forEach((winners, index) => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.textContent = `${roundText(index)}: ${formatWinnerGroup(winners)}`;
    el.resultItems.appendChild(item);
  });
  const title = el.resultList.querySelector('.result-title');
  if (title) title.textContent = `${state.settings.rounds}轮中奖结果`;
  if (!options.skipSeatRender) renderSeatStates();
}

function showAllResults() {
  if (!state.winners.length) return;
  el.winnerPanel.classList.remove('is-visible');
  el.resultList.classList.add('is-visible');
  el.showResultsBtn.classList.remove('is-visible');
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove('is-visible'), 2400);
}

function startDraw() {
  if (state.isDrawing) return;
  ensurePoolFreshBeforeDraw();
  const available = getAvailableCandidates();
  if (state.winners.length >= state.settings.rounds) {
    showToast('抽奖已结束, 请点击重置抽奖');
    return;
  }
  const remainingSeatsNeeded = (state.settings.rounds - state.winners.length) * state.settings.perRound;
  if (available.length < remainingSeatsNeeded) {
    showToast('候选座位不足, 请调整不参与座位或抽奖人数');
    return;
  }

  state.currentPool = available;
  state.isDrawing = true;
  el.winnerPanel.classList.remove('is-visible');
  el.resultList.classList.remove('is-visible');
  el.showResultsBtn.classList.remove('is-visible');
  el.halo.classList.add('is-drawing');
  el.introText.classList.add('is-hidden');
  el.rollingNumber.classList.add('is-active');
  el.roundBadge.textContent = `${roundText(state.winners.length)}抽奖中`;
  updateButtons();
  startBgmAfterGesture();

  state.rollingTimer = setInterval(() => {
    const seat = randomSeat(state.currentPool);
    if (!seat) return;
    state.currentCandidate = seat;
    el.rollingNumber.textContent = seatLabel(seat);
  }, 58);

  state.flyingTimer = setInterval(() => {
    for (let i = 0; i < 4; i += 1) {
      spawnFlyingNumber(randomSeat(state.currentPool));
    }
  }, 92);
}

function stopDraw() {
  if (!state.isDrawing) return;

  clearInterval(state.rollingTimer);
  clearInterval(state.flyingTimer);
  state.rollingTimer = null;
  state.flyingTimer = null;

  const available = getAvailableCandidates();
  const winners = pickWinners(available, state.settings.perRound);
  if (winners.length < state.settings.perRound) {
    state.isDrawing = false;
    showToast('候选座位不足, 无法完成本轮抽奖');
    updateButtons();
    return;
  }

  state.winners.push(winners);
  markWinnerKeysDirty();
  state.currentCandidate = winners[0];
  state.isDrawing = false;
  state.currentPool = [];

  el.rollingNumber.classList.remove('is-active');
  el.halo.classList.remove('is-drawing');
  el.introText.classList.add('is-hidden');
  el.winnerLabel.textContent = `${roundText(state.winners.length - 1)}中奖结果`;
  el.winnerNumber.textContent = formatWinnerGroup(winners);
  el.winnerPanel.classList.add('is-visible');
  const isFinished = state.winners.length >= state.settings.rounds;
  el.roundBadge.textContent = isFinished ? '抽奖完成' : `准备${roundText(state.winners.length)}`;
  el.showResultsBtn.classList.toggle('is-visible', isFinished);

  updateResults();
  updateButtons();
  launchFireworks();
  showToast(`${roundText(state.winners.length - 1)}中奖: ${formatWinnerGroup(winners)}`);
}

function resetDraw(options = {}) {
  clearInterval(state.rollingTimer);
  clearInterval(state.flyingTimer);
  state.rollingTimer = null;
  state.flyingTimer = null;
  state.winners = [];
  markWinnerKeysDirty();
  state.isDrawing = false;
  state.currentCandidate = null;
  state.currentPool = [];
  state.poolDirty = false;
  el.flyingLayer.innerHTML = '';
  el.introText.classList.remove('is-hidden');
  el.halo.classList.remove('is-drawing');
  el.rollingNumber.classList.remove('is-active');
  el.winnerPanel.classList.remove('is-visible');
  el.resultList.classList.remove('is-visible');
  el.showResultsBtn.classList.remove('is-visible');
  el.roundBadge.textContent = '准备抽奖';
  el.rollingNumber.textContent = seatLabel(state.candidates[state.candidates.length - 1]);
  updateResults({ skipSeatRender: options.skipSeatRender });
  updateButtons();
  if (!options.silent) showToast(options.message || '抽奖已重置');
}

function syncSettingsInputs() {
  el.roundsInput.value = state.settings.rounds;
  el.perRoundInput.value = state.settings.perRound;
  el.introTextInput.value = state.settings.introText || DEFAULT_INTRO_TEXT;
  el.introHighlightInput.value = state.settings.introHighlight || DEFAULT_INTRO_HIGHLIGHT;
  el.secondFloorInput.checked = state.settings.secondFloorEnabled;
  el.backgroundName.textContent = state.settings.backgroundName || '默认背景';
  el.bgmName.textContent = state.media.bgmName || '内置音乐';
  applyIntroText();
}

function applyIntroText() {
  const text = state.settings.introText || DEFAULT_INTRO_TEXT;
  const highlight = (state.settings.introHighlight || DEFAULT_INTRO_HIGHLIGHT).trim();
  el.introText.textContent = '';
  if (!highlight) {
    el.introText.textContent = text;
    return;
  }
  const start = text.indexOf(highlight);
  if (start < 0) {
    el.introText.textContent = text;
    return;
  }
  const before = text.slice(0, start);
  const after = text.slice(start + highlight.length);
  if (before) el.introText.appendChild(document.createTextNode(before));
  const mark = document.createElement('span');
  mark.className = 'intro-highlight';
  mark.textContent = highlight;
  el.introText.appendChild(mark);
  if (after) el.introText.appendChild(document.createTextNode(after));
}

function handleIntroTextInput() {
  const text = el.introTextInput.value.trim().slice(0, 24) || DEFAULT_INTRO_TEXT;
  state.settings.introText = text;
  applyIntroText();
  scheduleSaveSettings();
}

function handleIntroHighlightInput() {
  const highlight = el.introHighlightInput.value.trim().slice(0, 16) || DEFAULT_INTRO_HIGHLIGHT;
  state.settings.introHighlight = highlight;
  applyIntroText();
  scheduleSaveSettings();
}

function updateSeatStats() {
  recomputeSeatCounts();
}

function scheduleLowPriorityUiSync() {
  if (state.pendingUiTimer) return;

  const run = () => {
    state.pendingUiTimer = null;
    if (state.statsDirty) {
      if (state.countsDirty) {
        recomputeSeatCounts();
      } else {
        updateStatsTextFromCache();
        state.statsDirty = false;
      }
    }
    if (state.buttonsDirty) updateButtonsFast();
  };

  if ('requestIdleCallback' in window) {
    state.pendingUiTimer = requestIdleCallback(run, { timeout: 180 });
  } else {
    state.pendingUiTimer = setTimeout(run, 80);
  }
}

function markSeatConfigDirty() {
  state.poolDirty = true;
  state.statsDirty = true;
  state.buttonsDirty = true;
}

function adjustSeatCountForBlockedChange(key, isBlocked) {
  if (state.countsDirty) return;
  const seat = state.candidateMap.get(key);
  if (!seat || !isSeatLevelEnabled(seat)) return;

  const delta = isBlocked ? 1 : -1;
  state.blockedEnabledCountCache += delta;
  if (!getWinnerKeys().has(key)) {
    state.availableCountCache -= delta;
  }
  updateStatsTextFromCache();
  state.statsDirty = false;
}

function adjustSeatCountsForRange(blockedEnabledDelta, availableDelta) {
  if (state.countsDirty) return;
  state.blockedEnabledCountCache += blockedEnabledDelta;
  state.availableCountCache += availableDelta;
  updateStatsTextFromCache();
  state.statsDirty = false;
}

function ensurePoolFreshBeforeDraw() {
  if (!state.poolDirty) return;
  if (state.winners.length) {
    resetDraw({ silent: true, skipSeatRender: true });
    renderSeatStates();
    showToast('座位配置已变更, 已重置抽奖结果');
  }
  state.poolDirty = false;
  state.countsDirty = true;
  updateButtonsFast();
}

function hasSeatInRow(rowInfo, col) {
  return rowInfo.segments.some(([start, end]) => col >= start && col <= end);
}

function renderSeatMap() {
  if (state.seatMapRendered) return;
  el.seatMap.innerHTML = '';
  state.seatNodes = [];
  state.seatNodeMap.clear();
  const fragment = document.createDocumentFragment();
  SEAT_ROWS.forEach((rowInfo) => {
    if (rowInfo.row === 1 && rowInfo.level === '一层') {
      appendSeatSection('一层', fragment);
    }
    if (rowInfo.excelRow === 31) {
      appendSeatAisle('过道', fragment);
    }
    if (rowInfo.row === 1 && rowInfo.level === '二层') {
      appendSeatSection('二层', fragment);
    }

    const rowNode = document.createElement('div');
    rowNode.className = 'seat-row';

    const label = document.createElement('div');
    label.className = 'seat-row-label';
    label.textContent = rowInfo.level === '二层' ? `二层${rowInfo.row}排` : `${rowInfo.row}排`;
    rowNode.appendChild(label);

    for (let col = 1; col <= 42; col += 1) {
      if (!hasSeatInRow(rowInfo, col)) {
        const gap = document.createElement('span');
        gap.className = 'seat-gap';
        rowNode.appendChild(gap);
      } else {
        const key = seatKey(rowInfo.level, rowInfo.row, col);
        const seat = document.createElement('div');
        seat.className = 'seat-cell';
        seat.setAttribute('role', 'button');
        seat.tabIndex = 0;
        seat.dataset.key = key;
        seat.dataset.level = rowInfo.level;
        seat.dataset.label = seatLabel({ level: rowInfo.level, row: rowInfo.row, col });
        seat.setAttribute('aria-disabled', 'false');
        seat.textContent = col;
        seat.title = seat.dataset.label;
        state.seatNodes.push(seat);
        state.seatNodeMap.set(key, seat);
        rowNode.appendChild(seat);
      }

      if (col === 11 || col === 31) {
        const aisle = document.createElement('span');
        aisle.className = 'seat-vertical-aisle';
        rowNode.appendChild(aisle);
      }
    }

    fragment.appendChild(rowNode);
  });
  el.seatMap.appendChild(fragment);
  state.seatMapRendered = true;
  renderSeatStates();
}

function appendSeatSection(text, parent = el.seatMap) {
  const node = document.createElement('div');
  node.className = 'seat-section';
  node.textContent = text;
  parent.appendChild(node);
}

function appendSeatAisle(text, parent = el.seatMap) {
  const node = document.createElement('div');
  node.className = 'seat-aisle';
  node.textContent = text;
  parent.appendChild(node);
}

function applySeatNodeState(seat, winnerKeys = getWinnerKeys()) {
  const isBlocked = state.blocked.has(seat.dataset.key);
  const isWinner = winnerKeys.has(seat.dataset.key);
  const isDisabled = state.isDrawing || (seat.dataset.level === '二层' && !state.settings.secondFloorEnabled);
  seat.classList.toggle('is-blocked', isBlocked);
  seat.classList.toggle('is-winner', isWinner);
  seat.classList.toggle('is-disabled', isDisabled);
  seat.classList.toggle('is-level-disabled', isDisabled && seat.dataset.level === '二层');
  seat.setAttribute('aria-disabled', String(isDisabled));
}

function updateSeatNodeNow(key) {
  const seat = state.seatNodeMap.get(key);
  if (!seat) return;
  applySeatNodeState(seat, getWinnerKeys());
}

function normalizeSeatKeys(keys) {
  if (!keys) return null;
  return Array.isArray(keys) ? keys : [...keys];
}

function batchUpdateSeatNodes(keys, options = {}) {
  if (!state.seatMapRendered) {
    updateSeatStats();
    return Promise.resolve();
  }

  const token = ++state.seatRenderToken;
  const winnerKeys = getWinnerKeys();
  const keyList = normalizeSeatKeys(keys);
  const seats = keyList
    ? keyList.map((key) => state.seatNodeMap.get(key)).filter(Boolean)
    : state.seatNodes;
  const chunkSize = options.chunkSize || SEAT_BATCH_CHUNK_SIZE;
  let index = 0;

  return new Promise((resolve) => {
    function finish() {
      if (token === state.seatRenderToken) {
        if (!keyList || state.countsDirty) {
          recomputeSeatCounts();
        } else if (state.statsDirty) {
          updateStatsTextFromCache();
          state.statsDirty = false;
        }
      }
      resolve();
    }

    function processFrame() {
      if (token !== state.seatRenderToken) {
        resolve();
        return;
      }

      const end = Math.min(index + chunkSize, seats.length);
      while (index < end) {
        applySeatNodeState(seats[index], winnerKeys);
        index += 1;
      }

      if (index < seats.length) {
        requestAnimationFrame(processFrame);
      } else {
        finish();
      }
    }

    requestAnimationFrame(processFrame);
  });
}

function renderSeatStates(keys = null) {
  const keyList = normalizeSeatKeys(keys);
  if (keyList && keyList.length <= SMALL_SEAT_UPDATE_LIMIT) {
    const winnerKeys = getWinnerKeys();
    keyList.forEach((key) => {
      const seat = state.seatNodeMap.get(key);
      if (seat) applySeatNodeState(seat, winnerKeys);
    });
    return undefined;
  }

  return batchUpdateSeatNodes(keyList);
}

function toggleBlockedSeat(key) {
  if (state.isDrawing) return;
  const wasBlocked = state.blocked.has(key);
  if (wasBlocked) {
    state.blocked.delete(key);
  } else {
    state.blocked.add(key);
  }
  const isBlocked = !wasBlocked;
  updateSeatNodeNow(key);
  adjustSeatCountForBlockedChange(key, isBlocked);
  markSeatConfigDirty();
  scheduleLowPriorityUiSync();
  scheduleSaveSettings();
}

function applySettingsFromInputs() {
  const rounds = clampNumber(el.roundsInput.value, 1, 99, DEFAULT_ROUNDS);
  const perRound = clampNumber(el.perRoundInput.value, 1, 99, DEFAULT_PER_ROUND);
  const secondFloorEnabled = el.secondFloorInput.checked;
  const changed = rounds !== state.settings.rounds || perRound !== state.settings.perRound || secondFloorEnabled !== state.settings.secondFloorEnabled;
  state.settings.rounds = rounds;
  state.settings.perRound = perRound;
  state.settings.secondFloorEnabled = secondFloorEnabled;
  syncSettingsInputs();
  saveSettings();
  if (changed) {
    resetDraw({ silent: true, skipSeatRender: true });
    renderSeatStates();
    showToast('抽奖轮次设置已更新');
  }
  updateButtons();
}
async function applyRangeExclude() {
  if (state.isDrawing) return;
  const level = el.rangeLevelInput.value;
  const startRow = clampNumber(el.rangeStartRowInput.value, 1, 99, 0);
  const startCol = clampNumber(el.rangeStartColInput.value, 1, 42, 0);
  const endRow = clampNumber(el.rangeEndRowInput.value, 1, 99, 0);
  const endCol = clampNumber(el.rangeEndColInput.value, 1, 42, 0);
  if (!startRow || !startCol || !endRow || !endCol) {
    showToast('请填写完整的排除范围');
    return;
  }

  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  let count = 0;
  let blockedEnabledDelta = 0;
  let availableDelta = 0;
  const changedKeys = [];
  const winnerKeys = getWinnerKeys();

  state.candidates.forEach((seat) => {
    if (seat.level === level && seat.row >= minRow && seat.row <= maxRow && seat.col >= minCol && seat.col <= maxCol) {
      if (!state.blocked.has(seat.key)) {
        count += 1;
        changedKeys.push(seat.key);
        if (isSeatLevelEnabled(seat)) {
          blockedEnabledDelta += 1;
          if (!winnerKeys.has(seat.key)) availableDelta -= 1;
        }
      }
      state.blocked.add(seat.key);
    }
  });

  if (!count) {
    showToast('该范围内没有新的有效座位');
    return;
  }

  const isLargeUpdate = changedKeys.length > SMALL_SEAT_UPDATE_LIMIT;
  const originalText = el.rangeExcludeBtn.textContent;
  if (isLargeUpdate) {
    el.rangeExcludeBtn.disabled = true;
    el.rangeExcludeBtn.textContent = '处理中...';
  }
  scheduleSaveSettings();
  adjustSeatCountsForRange(blockedEnabledDelta, availableDelta);
  markSeatConfigDirty();
  scheduleLowPriorityUiSync();
  try {
    const renderResult = renderSeatStates(changedKeys);
    if (renderResult) await renderResult;
  } finally {
    if (isLargeUpdate) {
      el.rangeExcludeBtn.disabled = false;
      el.rangeExcludeBtn.textContent = originalText;
    }
  }
  showToast(`已排除 ${count} 个座位`);
}


function handleBackgroundSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件');
    event.target.value = '';
    return;
  }
  if (file.size > MAX_BACKGROUND_SIZE) {
    showToast('背景图不能超过 10MB');
    event.target.value = '';
    return;
  }

  const originalText = el.backgroundPickText.textContent;
  el.backgroundInput.disabled = true;
  el.backgroundPickText.textContent = '处理中...';
  const reader = new FileReader();

  reader.onload = () => {
    state.settings.backgroundDataUrl = reader.result;
    state.settings.backgroundName = file.name;
    el.backgroundName.textContent = state.settings.backgroundName;
    applyBackground();
    saveSettings();
    showToast('背景图片已更新');
  };
  reader.onerror = (error) => {
    console.error(error);
    showToast('背景图片读取失败');
  };
  reader.onloadend = () => {
    el.backgroundInput.disabled = false;
    el.backgroundInput.value = '';
    el.backgroundPickText.textContent = originalText;
  };
  reader.readAsDataURL(file);
}

function handleBgmSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('audio/')) {
    showToast('请选择音频文件');
    event.target.value = '';
    return;
  }
  if (file.size > MAX_BGM_SIZE) {
    showToast('BGM 不能超过 30MB');
    event.target.value = '';
    return;
  }

  const originalText = el.bgmPickText.textContent;
  el.bgmInput.disabled = true;
  el.bgmPickText.textContent = '处理中...';

  try {
    if (state.media.bgmObjectUrl) {
      URL.revokeObjectURL(state.media.bgmObjectUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    state.media.bgmUrl = objectUrl;
    state.media.bgmObjectUrl = objectUrl;
    state.media.bgmName = file.name;
    el.bgmName.textContent = file.name;
    stopSynthBgm();
    el.bgm.src = objectUrl;
    el.bgm.load();
    showToast('BGM 已更新, 本次打开页面内有效');
  } catch (error) {
    console.error(error);
    showToast('BGM 读取失败');
  } finally {
    el.bgmInput.disabled = false;
    el.bgmInput.value = '';
    el.bgmPickText.textContent = originalText;
  }
}

function resetMediaSettings() {
  state.settings.backgroundDataUrl = '';
  state.settings.backgroundName = '默认背景';
  if (state.media.bgmObjectUrl) {
    URL.revokeObjectURL(state.media.bgmObjectUrl);
  }
  state.media.bgmUrl = '';
  state.media.bgmObjectUrl = '';
  state.media.bgmName = '内置音乐';
  el.backgroundInput.value = '';
  el.bgmInput.value = '';
  el.backgroundName.textContent = '默认背景';
  el.bgmName.textContent = '内置音乐';
  el.bgm.pause();
  el.bgm.removeAttribute('src');
  el.bgm.load();
  applyBackground();
  saveSettings();
  showToast('已恢复默认媒体');
}

function restoreDefaultMode() {
  state.blocked.clear();
  state.settings.rounds = DEFAULT_ROUNDS;
  state.settings.perRound = DEFAULT_PER_ROUND;
  state.settings.secondFloorEnabled = true;
  state.settings.introText = DEFAULT_INTRO_TEXT;
  state.settings.introHighlight = DEFAULT_INTRO_HIGHLIGHT;
  state.settings.backgroundDataUrl = '';
  state.settings.backgroundName = '默认背景';
  el.backgroundInput.value = '';
  applyBackground();
  syncSettingsInputs();
  saveSettings();
  resetDraw({ silent: true, skipSeatRender: true });
  renderSeatStates();
  showToast('已恢复默认抽奖模式');
}

function setSettingsPage(page) {
  const isPhoto = page === 'photo';
  el.settingsPageTabBtn.classList.toggle('is-active', !isPhoto);
  el.photoPageTabBtn.classList.toggle('is-active', isPhoto);
  el.settingsPageTabBtn.setAttribute('aria-selected', String(!isPhoto));
  el.photoPageTabBtn.setAttribute('aria-selected', String(isPhoto));
  el.stage.classList.toggle('is-photo-mode', isPhoto);
  el.settingsPageTitle.textContent = isPhoto ? '合影模式' : '不参与座位与抽奖轮次';
}

function openSettings() {
  state.settingsOpen = true;
  el.stage.classList.add('is-settings-open');
  el.settingsPanel.classList.add('is-open');
  el.settingsPanel.setAttribute('aria-hidden', 'false');
  if (!state.seatMapRendered) {
    el.seatMap.textContent = '座位图加载中...';
    requestAnimationFrame(renderSeatMap);
  }
}

function closeSettings() {
  state.settingsOpen = false;
  el.stage.classList.remove('is-settings-open');
  el.settingsPanel.classList.remove('is-open');
  el.settingsPanel.setAttribute('aria-hidden', 'true');
}

function spawnFlyingNumber(seat) {
  if (!seat) return;

  const node = document.createElement('div');
  const angle = Math.random() * Math.PI * 2;
  const distance = 260 + Math.random() * 660;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance * 0.72;
  const scale = 0.62 + Math.random() * 1.5;
  const duration = 900 + Math.random() * 900;
  const alpha = 0.34 + Math.random() * 0.62;

  node.className = 'flying-number';
  node.textContent = seatLabel(seat);
  node.style.setProperty('--x', `${x}px`);
  node.style.setProperty('--y', `${y}px`);
  node.style.setProperty('--scale', scale.toFixed(2));
  node.style.setProperty('--duration', `${duration}ms`);
  node.style.setProperty('--alpha', alpha.toFixed(2));
  node.style.fontSize = `${22 + Math.random() * 42}px`;
  el.flyingLayer.appendChild(node);

  setTimeout(() => node.remove(), duration + 80);
}

function getBackgroundSource() {
  return state.settings.backgroundDataUrl || BACKGROUND_IMAGE;
}

function applyBackground(options = {}) {
  const source = getBackgroundSource();
  if (!source) {
    el.stage.classList.remove('has-bg');
    return;
  }

  el.stage.classList.remove('has-bg');
  el.stage.style.setProperty('--bg-image', `url("${source}")`);
  const testImage = new Image();
  testImage.onload = () => el.stage.classList.add('has-bg');
  testImage.onerror = () => {
    if (source !== BACKGROUND_IMAGE && !options.fallback) {
      showToast('背景图片加载失败, 已使用默认背景');
      state.settings.backgroundDataUrl = '';
      state.settings.backgroundName = '默认背景';
      el.backgroundName.textContent = '默认背景';
      saveSettings();
      applyBackground({ fallback: true });
    }
  };
  testImage.src = source;
}

function setupBackground() {
  applyBackground();
}

function getBgmSource() {
  return state.media.bgmUrl || BGM_SRC;
}

function setupAudio() {
  const source = getBgmSource();
  if (source) {
    el.bgm.src = source;
  }
  el.musicToggle.addEventListener('click', () => {
    state.bgmEnabled = !state.bgmEnabled;
    if (state.bgmEnabled) {
      startBgmAfterGesture();
    } else {
      stopBgm();
    }
    updateMusicButton();
  });
  updateMusicButton();
}

function updateMusicButton() {
  el.musicToggle.textContent = state.bgmEnabled ? '音乐 ON' : '音乐 OFF';
}

function startBgmAfterGesture() {
  if (!state.bgmEnabled) return;
  updateMusicButton();
  const source = getBgmSource();
  if (source) {
    if (el.bgm.src !== source) el.bgm.src = source;
    stopSynthBgm();
    el.bgm.play().catch(() => startSynthBgm());
  } else {
    startSynthBgm();
  }
}

function stopBgm() {
  el.bgm.pause();
  stopSynthBgm();
}

function startSynthBgm() {
  if (state.audioCtx || !state.bgmEnabled) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.07;
  master.connect(ctx.destination);

  const delay = ctx.createDelay();
  const feedback = ctx.createGain();
  const wet = ctx.createGain();
  delay.delayTime.value = 0.34;
  feedback.gain.value = 0.24;
  wet.gain.value = 0.18;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(master);

  const padGain = ctx.createGain();
  padGain.gain.value = 0.16;
  padGain.connect(master);
  padGain.connect(delay);

  [130.81, 196.00, 261.63].forEach((freq) => {
    const osc = ctx.createOscillator();
    const voiceGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    voiceGain.gain.value = 0.22;
    osc.connect(voiceGain);
    voiceGain.connect(padGain);
    osc.start();
    state.synthNodes.push(osc);
  });

  const notes = [523.25, 659.25, 783.99, 987.77, 880.00, 783.99, 659.25, 587.33];
  let step = 0;

  function playNote() {
    if (!state.audioCtx || !state.bgmEnabled) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = notes[step % notes.length];
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.12, now + 0.025);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    osc.connect(noteGain);
    noteGain.connect(master);
    noteGain.connect(delay);
    osc.start(now);
    osc.stop(now + 0.76);
    step += 1;
  }

  state.audioCtx = ctx;
  playNote();
  state.synthTimer = setInterval(playNote, 420);
}

function stopSynthBgm() {
  clearInterval(state.synthTimer);
  state.synthTimer = null;
  state.synthNodes.forEach((node) => {
    try {
      node.stop();
    } catch (error) {
      // Node may already be stopped.
    }
  });
  state.synthNodes = [];
  if (state.audioCtx) {
    state.audioCtx.close();
    state.audioCtx = null;
  }
}

function setupParticleCanvas() {
  const canvas = el.particleCanvas;
  const ctx = canvas.getContext('2d');
  const particles = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles.length = 0;
    const count = Math.min(180, Math.floor((window.innerWidth * window.innerHeight) / 9000));
    for (let i = 0; i < count; i += 1) {
      particles.push(createParticle());
    }
  }

  function createParticle() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.8 + Math.random() * 2.4,
      vx: -0.18 + Math.random() * 0.36,
      vy: -0.12 - Math.random() * 0.45,
      alpha: 0.18 + Math.random() * 0.58,
    };
  }

  function tick() {
    if (state.settingsOpen) {
      requestAnimationFrame(tick);
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -20 || p.x < -20 || p.x > window.innerWidth + 20) {
        Object.assign(p, createParticle(), { y: window.innerHeight + 10 });
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(110, 235, 255, ${p.alpha})`;
      ctx.shadowColor = 'rgba(110, 235, 255, 0.9)';
      ctx.shadowBlur = 12;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  tick();
}

function launchFireworks() {
  const canvas = el.fireworkCanvas;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particles = [];
  const colors = ['#ffd36a', '#ff8c22', '#64eaff', '#ffffff', '#ff4f7b'];

  for (let burst = 0; burst < 7; burst += 1) {
    const cx = window.innerWidth * (0.22 + Math.random() * 0.56);
    const cy = window.innerHeight * (0.22 + Math.random() * 0.34);
    for (let i = 0; i < 80; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.2 + Math.random() * 7.4;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 70 + Math.random() * 34,
        age: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 4,
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach((p) => {
      p.age += 1;
      p.vy += 0.045;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      const alpha = Math.max(0, 1 - p.age / p.life);
      ctx.beginPath();
      ctx.fillStyle = hexToRgba(p.color, alpha);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 18;
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      if (particles[i].age >= particles[i].life) {
        particles.splice(i, 1);
      }
    }

    if (particles.length) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  tick();
}

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function bindEvents() {
  el.startBtn.addEventListener('click', startDraw);
  el.stopBtn.addEventListener('click', stopDraw);
  el.resetBtn.addEventListener('click', () => resetDraw());
  el.showResultsBtn.addEventListener('click', showAllResults);
  el.settingsToggle.addEventListener('click', openSettings);
  el.settingsClose.addEventListener('click', closeSettings);
  el.settingsPanel.addEventListener('click', (event) => {
    if (event.target === el.settingsPanel) closeSettings();
  });
  el.seatMap.addEventListener('click', (event) => {
    const seat = event.target.closest('.seat-cell');
    if (!seat || state.isDrawing || seat.classList.contains('is-disabled')) return;
    toggleBlockedSeat(seat.dataset.key);
  });
  el.seatMap.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const seat = event.target.closest('.seat-cell');
    if (!seat || state.isDrawing || seat.classList.contains('is-disabled')) return;
    event.preventDefault();
    toggleBlockedSeat(seat.dataset.key);
  });
  if (el.seatBoardWrap) {
    el.seatBoardWrap.addEventListener('scroll', () => {
      el.seatMap.classList.add('is-scrolling');
      clearTimeout(el.seatMap.scrollTimer);
      el.seatMap.scrollTimer = setTimeout(() => {
        el.seatMap.classList.remove('is-scrolling');
      }, 100);
    }, { passive: true });
  }
  el.roundsInput.addEventListener('change', applySettingsFromInputs);
  el.perRoundInput.addEventListener('change', applySettingsFromInputs);
  el.introTextInput.addEventListener('input', handleIntroTextInput);
  el.introHighlightInput.addEventListener('input', handleIntroHighlightInput);
  el.secondFloorInput.addEventListener('change', applySettingsFromInputs);
  el.settingsPageTabBtn.addEventListener('click', () => setSettingsPage('draw'));
  el.photoPageTabBtn.addEventListener('click', () => setSettingsPage('photo'));
  el.rangeExcludeBtn.addEventListener('click', applyRangeExclude);
  el.backgroundInput.addEventListener('change', handleBackgroundSelect);
  el.bgmInput.addEventListener('change', handleBgmSelect);
  el.clearMediaBtn.addEventListener('click', resetMediaSettings);
  el.defaultModeBtn.addEventListener('click', restoreDefaultMode);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && el.settingsPanel.classList.contains('is-open')) {
      closeSettings();
    }
  });
  window.addEventListener('beforeunload', flushScheduledSettingsSave);
}

function init() {
  buildCandidates();
  loadSettings();
  syncSettingsInputs();
  setSettingsPage('draw');
  setupBackground();
  setupAudio();
  setupParticleCanvas();
  bindEvents();
  resetDraw({ silent: true });
  updateButtons();
}

init();
