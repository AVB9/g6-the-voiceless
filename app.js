(function () {
  const STORAGE_KEY = 'g6_voiceless_responses_v3';
  const ADMIN_PASSCODE = '7018';
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('g6_voiceless_wall_v3') : null;

  let responses = loadResponses();
  let hasSubmittedThisLoad = false; // Resets automatically on page reload

  let answers = {
    q2Entertainment: '',
    q3ThreeRs: '',
    q4Sentience: ''
  };

  const CORRECT_THREE_RS = 'Replace, Reduce, Refine';
  const CORRECT_SENTIENCE = 'The ability to perceive and feel pain, fear, pleasure, and comfort';

  const q2OptionsPool = [
    'NEVER',
    'ONLY FOR CONSERVATION',
    "IT'S FINE"
  ];

  const q3OptionsPool = [
    CORRECT_THREE_RS,
    'Rescue, Rehabilitate, Release',
    'Respect, Restore, Retain'
  ];

  const q4OptionsPool = [
    CORRECT_SENTIENCE,
    'The ability to speak and understand human language',
    'Automatic survival instincts without emotions or feelings'
  ];

  const homeView = document.getElementById('homeView');
  const formView = document.getElementById('formView');
  const topActionBar = document.getElementById('topActionBar');
  const boardFrame = document.getElementById('boardFrame');
  const emptyStateBox = document.getElementById('emptyStateBox');
  const quotesCanvas = document.getElementById('quotesCanvas');
  const ethicsForm = document.getElementById('ethicsForm');
  const formErrorMsg = document.getElementById('formErrorMsg');
  const scoreModal = document.getElementById('scoreModal');

  const rotations = ['-2.2deg', '1.6deg', '-1.1deg', '2.1deg', '-1.8deg', '0.9deg', '-0.7deg', '1.4deg'];
  const offsetsY = ['0px', '14px', '-8px', '18px', '-6px', '10px', '4px', '-10px'];
  const offsetsX = ['0px', '6px', '-6px', '10px', '-8px', '4px', '-4px', '8px'];
  const fontSizes = ['1.18rem', '1.28rem', '1.12rem', '1.24rem', '1.15rem', '1.3rem'];

  function loadResponses() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveResponses() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
    } catch (e) {}
    if (bc) {
      bc.postMessage({ type: 'SYNC', data: responses });
    }
    renderHome();
  }

  if (bc) {
    bc.onmessage = function (ev) {
      if (ev.data && ev.data.type === 'SYNC' && Array.isArray(ev.data.data)) {
        responses = ev.data.data;
        renderHome();
      }
    };
  }

  window.addEventListener('storage', function (ev) {
    if (ev.key === STORAGE_KEY) {
      responses = loadResponses();
      renderHome();
    }
  });

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function renderOptionButtons(containerId, qKey, optionsArray) {
    const container = document.getElementById(containerId);
    const shuffled = shuffleArray(optionsArray);
    container.innerHTML = '';

    shuffled.forEach(function (optText) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill-option';
      btn.textContent = optText;
      btn.addEventListener('click', function () {
        container.querySelectorAll('.pill-option').forEach(function (b) {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
        answers[qKey] = optText;
        formErrorMsg.classList.add('hidden');
      });
      container.appendChild(btn);
    });
  }

  function showHomeView() {
    formView.classList.add('hidden');
    homeView.classList.remove('hidden');

    if (hasSubmittedThisLoad) {
      topActionBar.classList.add('hidden');
    } else {
      topActionBar.classList.remove('hidden');
    }

    renderHome();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showFormView() {
    ethicsForm.reset();
    answers = { q2Entertainment: '', q3ThreeRs: '', q4Sentience: '' };
    formErrorMsg.classList.add('hidden');

    renderOptionButtons('q2Container', 'q2Entertainment', q2OptionsPool);
    renderOptionButtons('q3Container', 'q3ThreeRs', q3OptionsPool);
    renderOptionButtons('q4Container', 'q4Sentience', q4OptionsPool);

    homeView.classList.add('hidden');
    formView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderHome() {
    renderBoardQuotes();
    renderBoardStanceLedger();
  }

  function renderBoardQuotes() {
    if (responses.length === 0) {
      emptyStateBox.classList.remove('hidden');
      quotesCanvas.classList.add('hidden');
      quotesCanvas.innerHTML = '';
      return;
    }

    emptyStateBox.classList.add('hidden');
    quotesCanvas.classList.remove('hidden');

    quotesCanvas.innerHTML = responses.map(function (item, idx) {
      const rot = rotations[idx % rotations.length];
      const oy = offsetsY[idx % offsetsY.length];
      const ox = offsetsX[idx % offsetsX.length];
      const fsize = fontSizes[idx % fontSizes.length];
      const delay = ((idx % 5) * 0.65).toFixed(2) + 's';

      return (
        '<blockquote class="chalk-quote-item" style="--rot:' + rot + '; --offset-y:' + oy + '; --offset-x:' + ox + '; --fsize:' + fsize + '; --delay:' + delay + ';">' +
          '<p class="chalk-quote-text">&ldquo;' + escapeHtml(item.promise) + '&rdquo;</p>' +
          '<cite class="chalk-quote-author">- ' + escapeHtml(item.name) + '</cite>' +
        '</blockquote>'
      );
    }).join('');
  }

  function renderBoardStanceLedger() {
    let counts = {
      NEVER: 0,
      CONSERVATION: 0,
      FINE: 0
    };

    responses.forEach(function (r) {
      if (r.entertainment === 'NEVER') counts.NEVER += 1;
      else if (r.entertainment === 'ONLY FOR CONSERVATION') counts.CONSERVATION += 1;
      else if (r.entertainment === "IT'S FINE") counts.FINE += 1;
    });

    const total = counts.NEVER + counts.CONSERVATION + counts.FINE;

    if (total === 0) {
      document.getElementById('pct_NEVER').textContent = '0%';
      document.getElementById('pct_CONSERVATION').textContent = '0%';
      document.getElementById('pct_FINE').textContent = '0%';
      document.getElementById('seg_NEVER').style.width = '33.3%';
      document.getElementById('seg_CONSERVATION').style.width = '33.3%';
      document.getElementById('seg_FINE').style.width = '33.4%';
      return;
    }

    const pNever = Math.round((counts.NEVER / total) * 100);
    const pCons = Math.round((counts.CONSERVATION / total) * 100);
    const pFine = Math.max(0, 100 - pNever - pCons);

    document.getElementById('pct_NEVER').textContent = pNever + '%';
    document.getElementById('pct_CONSERVATION').textContent = pCons + '%';
    document.getElementById('pct_FINE').textContent = pFine + '%';

    document.getElementById('seg_NEVER').style.width = Math.max(4, pNever) + '%';
    document.getElementById('seg_CONSERVATION').style.width = Math.max(4, pCons) + '%';
    document.getElementById('seg_FINE').style.width = Math.max(4, pFine) + '%';
  }

  // Invisible Bottom-Right Fullscreen Button
  document.getElementById('fullscreenBoardBtn').addEventListener('click', function () {
    const isNativeFs = document.fullscreenElement || document.webkitFullscreenElement;
    if (isNativeFs) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      boardFrame.classList.remove('is-fullscreen');
      return;
    }

    if (boardFrame.classList.contains('is-fullscreen')) {
      boardFrame.classList.remove('is-fullscreen');
      return;
    }

    if (boardFrame.requestFullscreen) {
      boardFrame.requestFullscreen().catch(function () {
        boardFrame.classList.toggle('is-fullscreen');
      });
    } else if (boardFrame.webkitRequestFullscreen) {
      boardFrame.webkitRequestFullscreen();
    } else {
      boardFrame.classList.toggle('is-fullscreen');
    }
  });

  // Form Submission -> Show Score Pop-up
  ethicsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const nameVal = (document.getElementById('q1Name').value || '').trim();
    const promiseVal = (document.getElementById('q5Promise').value || '').trim();

    if (!nameVal || !answers.q2Entertainment || !answers.q3ThreeRs || !answers.q4Sentience || !promiseVal) {
      formErrorMsg.classList.remove('hidden');
      return;
    }

    const is3RsCorrect = (answers.q3ThreeRs === CORRECT_THREE_RS);
    const isSentienceCorrect = (answers.q4Sentience === CORRECT_SENTIENCE);
    const score = (is3RsCorrect ? 1 : 0) + (isSentienceCorrect ? 1 : 0);

    const newEntry = {
      id: 'resp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: nameVal,
      entertainment: answers.q2Entertainment,
      threeRs: answers.q3ThreeRs,
      sentience: answers.q4Sentience,
      promise: promiseVal,
      score: score,
      createdAt: new Date().toISOString()
    };

    responses.unshift(newEntry);
    saveResponses();

    document.getElementById('scoreNumberDisplay').textContent = score + ' / 2';
    document.getElementById('scoreFeedbackText').textContent =
      score === 2
        ? 'Spot on! Your quote and vote are now live on the Group G6 board.'
        : 'Thank you for speaking up! Here is a quick recap of the ethics concepts:';

    document.getElementById('scoreBreakdownList').innerHTML =
      '<div>' +
        '<div class="score-item-title">The 3 Rs Framework: ' + (is3RsCorrect ? 'Correct' : 'Review') + '</div>' +
        '<div class="score-item-detail">Answer: ' + escapeHtml(CORRECT_THREE_RS) + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="score-item-title">Understanding Sentience: ' + (isSentienceCorrect ? 'Correct' : 'Review') + '</div>' +
        '<div class="score-item-detail">Answer: ' + escapeHtml(CORRECT_SENTIENCE) + '</div>' +
      '</div>';

    scoreModal.classList.remove('hidden');
  });

  // Clicking "Done" on the Score Pop-up hides the form button for this session and goes to Home Page
  document.getElementById('scoreDoneBtn').addEventListener('click', function () {
    hasSubmittedThisLoad = true;
    scoreModal.classList.add('hidden');
    showHomeView();
  });

  document.getElementById('openFormBtn').addEventListener('click', showFormView);
  document.getElementById('backToHomeBtn').addEventListener('click', function () {
    showHomeView();
  });

  // Admin Board Controls (Requires 5 consecutive clicks on "G6 EXHIBITION" + Passcode: 7018)
  const adminModal = document.getElementById('adminModal');
  const adminLockStep = document.getElementById('adminLockStep');
  const adminPanelStep = document.getElementById('adminPanelStep');
  const adminPassInput = document.getElementById('adminPassInput');
  const adminPassError = document.getElementById('adminPassError');
  const adminResponsesList = document.getElementById('adminResponsesList');
  const adminTotalCount = document.getElementById('adminTotalCount');

  let clickCount = 0;
  let clickTimer = null;

  document.getElementById('adminTrigger').addEventListener('click', function () {
    clickCount += 1;
    clearTimeout(clickTimer);
    if (clickCount >= 5) {
      clickCount = 0;
      openAdminLock();
    } else {
      clickTimer = setTimeout(function () {
        clickCount = 0;
      }, 1100);
    }
  });

  function openAdminLock() {
    adminPassInput.value = '';
    adminPassError.classList.add('hidden');
    adminLockStep.classList.remove('hidden');
    adminPanelStep.classList.add('hidden');
    adminModal.classList.remove('hidden');
    setTimeout(function () {
      adminPassInput.focus();
    }, 50);
  }

  function unlockAdminPanel() {
    if (adminPassInput.value.trim() !== ADMIN_PASSCODE) {
      adminPassError.classList.remove('hidden');
      return;
    }
    adminPassError.classList.add('hidden');
    adminLockStep.classList.add('hidden');
    adminPanelStep.classList.remove('hidden');
    renderAdminList();
  }

  function renderAdminList() {
    adminTotalCount.textContent = responses.length + (responses.length === 1 ? ' item' : ' items');
    if (responses.length === 0) {
      adminResponsesList.innerHTML = '<p style="font-size:13px; color:rgba(245,239,230,0.6); text-align:center; padding:14px 0;">No responses on the board yet.</p>';
      return;
    }

    adminResponsesList.innerHTML = '';
    responses.forEach(function (item, index) {
      const row = document.createElement('div');
      row.className = 'admin-response-row';

      const info = document.createElement('div');
      info.className = 'admin-response-info';
      info.innerHTML =
        '<div class="admin-response-name">' + escapeHtml(item.name) + ' &middot; ' + escapeHtml(item.entertainment || '') + '</div>' +
        '<div class="admin-response-quote">&ldquo;' + escapeHtml(item.promise) + '&rdquo;</div>';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'remove-item-btn';
      delBtn.textContent = 'Remove';
      delBtn.addEventListener('click', function () {
        responses.splice(index, 1);
        saveResponses();
        renderAdminList();
      });

      row.appendChild(info);
      row.appendChild(delBtn);
      adminResponsesList.appendChild(row);
    });
  }

  document.getElementById('unlockAdminBtn').addEventListener('click', unlockAdminPanel);
  adminPassInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') unlockAdminPanel();
  });

  document.getElementById('closeLockModalBtn').addEventListener('click', function () {
    adminModal.classList.add('hidden');
  });

  document.getElementById('closeAdminBtn').addEventListener('click', function () {
    adminModal.classList.add('hidden');
  });

  document.getElementById('clearAllBtn').addEventListener('click', function () {
    responses = [];
    saveResponses();
    renderAdminList();
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  renderHome();
})();
