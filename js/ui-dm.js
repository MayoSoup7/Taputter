/*
 * ui-dm.js
 * -----------------------------------------------------------------------
 * DMタブ：吹き出し表示、スタンプ、入力中アニメ、既読、複数バブル送信を
 * 担当する、このアプリで一番作り込みたいパートです。
 * -----------------------------------------------------------------------
 */

const TapuUI_DM = (() => {
  let isTapuBusy = false; // たぷが返信中は連投を防ぐ

  function bubbleHTML(msg) {
    const fromClass = msg.from === 'player' ? 'tsns-from-player' : 'tsns-from-tapu';
    const avatar = msg.from === 'player'
      ? TapuUtils.playerAvatarHTML('sm')
      : TapuUtils.avatarHTML(window.TapuSNS_Config.CHARACTERS.tapu, 'sm');

    let bodyHTML;
    if (msg.type === 'stamp') {
      bodyHTML = `<div class="tsns-bubble tsns-stamp-bubble">${TapuUtils.escapeHtml(msg.text)}</div>`;
    } else if (msg.type === 'image') {
      bodyHTML = `<div class="tsns-dm-img-bubble" onclick="document.getElementById('tsns-image-viewer').classList.remove('tsns-hidden');document.getElementById('tsns-image-full').src=this.querySelector('img').src;">
        <img src="${TapuUtils.escapeHtml(msg.imageUrl || '')}" alt="">
      </div>`;
    } else if (msg.type === 'voice') {
      const dur = msg.duration || '0:03';
      const audioAttr = msg.audioUrl ? `data-audio-url="${TapuUtils.escapeHtml(msg.audioUrl)}"` : '';
      bodyHTML = `
        <div class="tsns-voice-bubble" ${audioAttr}>
          <div class="tsns-voice-play">▶</div>
          <div class="tsns-voice-waveform">${Array.from({length: 14}).map(() => `<div class="tsns-wv-bar" style="height:${6 + Math.floor(Math.random() * 14)}px;"></div>`).join('')}</div>
          <div class="tsns-voice-dur">${TapuUtils.escapeHtml(dur)}</div>
        </div>
        ${msg.text ? `<div class="tsns-voice-caption tsns-voice-caption-hidden">${TapuUtils.formatContent(msg.text)}</div>` : ''}`;
    } else {
      bodyHTML = `<div class="tsns-bubble">${TapuUtils.formatContent(msg.text)}</div>`;
    }

    const readHTML = (msg.from === 'player' && msg.read) ? '<span class="tsns-msg-read">既読</span>' : '';
    const metaHTML = `<div class="tsns-msg-meta">${readHTML}<span>${TapuUtils.formatClock(msg.createdAt)}</span></div>`;

    return `
      <div class="tsns-msg ${fromClass}">
        ${avatar}
        <div>
          ${bodyHTML}
          ${metaHTML}
        </div>
      </div>`;
  }

  function renderDM() {
    const el = document.getElementById('tsns-dm-msgs');
    if (!el) return;
    const msgs = TapuSNS_State.getDmThread();
    el.innerHTML = msgs.map(bubbleHTML).join('');
    bindVoiceBubbles(el);
    scrollToBottom();
  }

  function bindVoiceBubbles(container) {
    container.querySelectorAll('.tsns-voice-bubble').forEach(bubble => {
      bubble.addEventListener('click', () => {
        // 再生っぽい演出（波形を一瞬揺らす）＋ SE
        bubble.classList.add('tsns-voice-playing');
        setTimeout(() => bubble.classList.remove('tsns-voice-playing'), 900);
        window.TapuSound.play('Decision1');

        const url = bubble.dataset.audioUrl;
        if (url) {
          const audio = new Audio(url);
          audio.play().catch(() => { /* 音声ファイル未配置の場合は無視（タップ演出だけ楽しめる） */ });
        }

        // 開くまで内容がわからない演出：タップした時に初めてキャプションを見せる
        const caption = bubble.parentElement.querySelector('.tsns-voice-caption');
        if (caption) caption.classList.remove('tsns-voice-caption-hidden');
      });
    });
  }

  function scrollToBottom() {
    const el = document.getElementById('tsns-dm-msgs');
    if (el) el.scrollTop = el.scrollHeight;
  }

  const TYPING_LABEL_TEXT = 'たぷが入力中…';

  function setTyping(visible) {
    const el = document.getElementById('tsns-typing');
    if (!el) return;
    if (visible) {
      const label = document.getElementById('tsns-typing-label');
      if (label && label.childElementCount === 0) {
        label.innerHTML = TYPING_LABEL_TEXT.split('').map(ch => `<span>${TapuUtils.escapeHtml(ch)}</span>`).join('');
      }
    }
    el.classList.toggle('tsns-hidden', !visible);
    if (visible) scrollToBottom();
  }

  function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

  // プレイヤーのメッセージを既読にして画面へ反映
  function markLastPlayerMessageRead() {
    TapuSNS_State.markDmRead(); // 呼び出し側の全既読フラグはこの実装ではシンプルに全既読にする
    renderDM();
  }

  // たぷがスタンプ返信として使う候補（愛情表現多め）
  const TAPU_STAMP_REPLIES = ['💕', '🍡', '✨', '🥰', '😆', '🎉', '❤️', '🌸', '🫶', '🌟'];

  async function deliverTapuStampReply() {
    isTapuBusy = true;
    setTyping(true);
    await sleep(700 + Math.random() * 700);
    setTyping(false);
    const stamp = TAPU_STAMP_REPLIES[Math.floor(Math.random() * TAPU_STAMP_REPLIES.length)];
    TapuSNS_State.addDmMessage({ from: 'tapu', text: stamp, type: 'stamp' });
    renderDM();
    updateBadge();
    isTapuBusy = false;
  }

  async function deliverTapuReply(parts) {
    isTapuBusy = true;
    for (let i = 0; i < parts.length; i++) {
      setTyping(true);
      // 文字数に応じて少し待つ（本当に打っているような間）
      const thinkTime = 700 + Math.min(parts[i].length * 35, 1800) + Math.random() * 500;
      await sleep(thinkTime);
      setTyping(false);
      TapuSNS_State.addDmMessage({ from: 'tapu', text: parts[i], type: 'text' });
      renderDM();
      updateBadge();
      await sleep(250);
    }
    isTapuBusy = false;
  }

  async function sendPlayerText(text, type = 'text') {
    if (!text || isTapuBusy) return;
    TapuSNS_State.addDmMessage({ from: 'player', text, type });
    renderDM();
    window.TapuSound.play('Book2');

    // 少し間を置いてから既読がつく（実際に読んでいるような間）
    await sleep(500 + Math.random() * 500);
    markLastPlayerMessageRead();

    const profile = TapuSNS_State.getProfile();
    await sleep(300);

    if (type === 'stamp') {
      await deliverTapuStampReply();
      return;
    }

    // 「ボイスメッセージ送って」等のリクエストにはボイスDMで応える
    if (/ボイス/.test(text)) {
      await deliverTapuVoiceReply();
      return;
    }

    const parts = window.TapuSNS_State.getDmMode() === 'zatsudan'
      ? window.TapuReplyEngine.generate(text, profile.nickname)
      : window.TapuReplyEngine.generateForMode(window.TapuSNS_State.getDmMode(), profile.nickname);
    await deliverTapuReply(parts);
  }

  async function deliverTapuVoiceReply() {
    isTapuBusy = true;
    setTyping(true);
    await sleep(1000 + Math.random() * 1200);
    setTyping(false);

    const v = window.TapuVoice ? window.TapuVoice.pickLine(TapuSNS_State.getDmMode()) : null;
    if (!v) {
      TapuSNS_State.addDmMessage({ from: 'tapu', text: 'ボイス送りたいんだけど、まだ準備できてないみたい…ごめんね💦', type: 'text' });
      renderDM();
      isTapuBusy = false;
      return;
    }

    const profile = TapuSNS_State.getProfile();
    const caption = window.TapuReplyEngine.applyName(v.caption, profile.nickname);
    TapuSNS_State.addDmMessage({
      from: 'tapu', type: 'voice',
      text: caption,
      audioUrl: v.file ? `assets/voice/${v.file}` : '',
      duration: v.duration,
    });
    renderDM();
    updateBadge();
    isTapuBusy = false;
  }

  function submitDmInput() {
    const input = document.getElementById('tsns-dm-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    sendPlayerText(text, 'text');
  }

  function sendStamp(stamp) {
    sendPlayerText(stamp, 'stamp');
    document.getElementById('tsns-stamp-panel').classList.add('tsns-hidden');
  }

  function renderWordPanel() {
    const panel = document.getElementById('tsns-word-panel');
    const hints = window.WORD_HINTS || [];
    panel.innerHTML = hints.map(h => `<button class="tsns-word-chip" data-word="${TapuUtils.escapeHtml(h.word)}">${h.emoji} ${TapuUtils.escapeHtml(h.word)}</button>`).join('');
    panel.querySelectorAll('.tsns-word-chip').forEach(btn => {
      btn.addEventListener('click', () => insertWord(btn.dataset.word));
    });
  }

  function insertWord(word) {
    const input = document.getElementById('tsns-dm-input');
    const sep = input.value && !/\s$/.test(input.value) ? ' ' : '';
    input.value = input.value + sep + word;
    input.focus();
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    document.getElementById('tsns-word-panel').classList.add('tsns-hidden');
  }
  function renderStampPanel() {
    const panel = document.getElementById('tsns-stamp-panel');
    const stamps = window.TapuSNS_Config.stamps || [];
    panel.innerHTML = stamps.map(s => `<button class="tsns-stamp-btn" data-stamp="${s}">${s}</button>`).join('');
    panel.querySelectorAll('.tsns-stamp-btn').forEach(btn => {
      btn.addEventListener('click', () => sendStamp(btn.dataset.stamp));
    });
  }

  function updateBadge() {
    if (window.TapuUI_Main) window.TapuUI_Main.updateBadges();
  }

  const MODE_LABELS = {
    zatsudan: '💬 雑談モードに切り替えたよ〜',
    zentei: '💯 全肯定モードに切り替えたよ！何でも肯定しちゃう！',
    ouen: '📣 応援モードに切り替えたよ！全力で応援するね！',
    amaama: '💕 甘々モードに切り替えたよ…えへへ💕',
    soudan: '🧸 相談モードに切り替えたよ、ゆっくり聞かせてね',
    aori: '😏 煽りモードに切り替えたよ〜？覚悟しときなよ',
    mesugaki: '😼 メスガキモードに切り替えたよ、せいぜい頑張って？',
    tsundere: '😤 べ、別にモード切り替えたわけじゃないんだからね！',
    ojousama: '👑 お嬢様モードに切り替えましたわ、ごきげんよう♪',
  };

  function renderModeBar() {
    const mode = TapuSNS_State.getDmMode();
    document.querySelectorAll('.tsns-mode-btn').forEach(btn => {
      btn.classList.toggle('tsns-mode-active', btn.dataset.mode === mode);
    });
  }

  function switchMode(mode) {
    if (TapuSNS_State.getDmMode() === mode) return;
    TapuSNS_State.setDmMode(mode);
    renderModeBar();

    const el = document.getElementById('tsns-dm-msgs');
    if (el) {
      const notice = document.createElement('div');
      notice.className = 'tsns-mode-system-msg';
      notice.textContent = MODE_LABELS[mode] || '';
      el.appendChild(notice);
      scrollToBottom();
    }
    window.TapuSound.play('Decision1');
  }

  function bindModeBar() {
    document.querySelectorAll('.tsns-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });
    renderModeBar();
  }

  function bindEvents() {
    const input = document.getElementById('tsns-dm-input');
    const sendBtn = document.getElementById('tsns-dm-send');

    sendBtn.addEventListener('click', submitDmInput);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitDmInput(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });

    document.getElementById('tsns-stamp-toggle').addEventListener('click', () => {
      document.getElementById('tsns-word-panel').classList.add('tsns-hidden');
      document.getElementById('tsns-stamp-panel').classList.toggle('tsns-hidden');
    });
    document.getElementById('tsns-word-toggle').addEventListener('click', () => {
      document.getElementById('tsns-stamp-panel').classList.add('tsns-hidden');
      document.getElementById('tsns-word-panel').classList.toggle('tsns-hidden');
    });

    renderStampPanel();
    renderWordPanel();
    bindModeBar();
  }

  return { renderDM, bindEvents, scrollToBottom };
})();

if (typeof window !== 'undefined') {
  window.TapuUI_DM = TapuUI_DM;
}
