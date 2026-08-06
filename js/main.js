/*
 * main.js
 * -----------------------------------------------------------------------
 * アプリのエントリーポイント。データの読み込み、タブ切り替え、
 * バッジ更新など、画面全体に関わる処理をまとめています。
 * -----------------------------------------------------------------------
 */

const TapuUI_Main = (() => {
  let currentTab = 'home';

  function updateBadges() {
    const meta = TapuSNS_State.getMeta();
    const dmBadge = document.getElementById('tsns-badge-dm');
    const notifyBadge = document.getElementById('tsns-badge-notify');

    if (meta.unreadDm > 0 && currentTab !== 'dm') {
      dmBadge.textContent = meta.unreadDm > 99 ? '99+' : meta.unreadDm;
      dmBadge.classList.remove('tsns-hidden');
    } else {
      dmBadge.classList.add('tsns-hidden');
    }

    if (meta.unreadNotify > 0 && currentTab !== 'notify') {
      notifyBadge.textContent = meta.unreadNotify > 99 ? '99+' : meta.unreadNotify;
      notifyBadge.classList.remove('tsns-hidden');
    } else {
      notifyBadge.classList.add('tsns-hidden');
    }
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tsns-panel').forEach(p => p.classList.add('tsns-hidden'));
    document.querySelectorAll('.tsns-tab').forEach(b => b.classList.remove('tsns-active'));

    const panel = document.getElementById(`tsns-panel-${tab}`);
    if (panel) panel.classList.remove('tsns-hidden');
    const btn = document.querySelector(`.tsns-tab[data-panel="${tab}"]`);
    if (btn) btn.classList.add('tsns-active');

    switch (tab) {
      case 'home':
        window.TapuUI_Home.renderTimeline();
        break;
      case 'dm':
        window.TapuUI_DM.renderDM();
        TapuSNS_State.markDmRead();
        updateBadges();
        break;
      case 'notify':
        window.TapuUI_Notify.renderNotifications();
        TapuSNS_State.markNotifRead();
        updateBadges();
        break;
      case 'tapu-profile':
        window.TapuUI_Profile.renderTapuProfile();
        break;
      case 'my-profile':
        window.TapuUI_Profile.loadMyProfileForm();
        break;
    }
  }

  function bindTabs() {
    document.querySelectorAll('.tsns-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.panel));
    });
  }

  function bindHeader() {
    document.getElementById('tsns-header-icon-btn').addEventListener('click', () => {
      const ok = confirm('セーブデータをリセットしますか？（投稿・DM履歴・プロフィールが全て消えます）');
      if (ok) {
        TapuSNS_State.reset();
        location.reload();
      }
    });
  }

  async function init() {
    TapuSNS_State.load();
    TapuSNS_State.touchLastOpened();

    // 先にUIを組み立てて、タブ切り替え等は必ず動くようにする
    bindTabs();
    bindHeader();
    window.TapuUI_Home.bindEvents();
    window.TapuUI_DM.bindEvents();
    window.TapuUI_Profile.bindEvents();

    switchTab('home');
    updateBadges();

    // txtデータの読み込みは非同期で行う（file://直開き等で失敗しても
    // アプリ本体が固まらないようにtry/catchで保護する）
    try {
      await Promise.all([
        window.TapuReplyEngine.loadAll(),
        window.TapuNotifyEngine.loadAll(),
      ]);
    } catch (e) {
      console.error('データ読み込みに失敗しました。ローカルサーバー経由で開いているか確認してください。', e);
      showLoadErrorNotice();
    }

    if (window.TapuEngagement) window.TapuEngagement.init();
  }

  function showLoadErrorNotice() {
    const el = document.getElementById('tsns-timeline');
    if (el && currentTab === 'home') {
      const notice = document.createElement('div');
      notice.className = 'tsns-empty';
      notice.style.color = '#e91e8c';
      notice.textContent = '⚠️ データの読み込みに失敗しました。file://で直接開いていませんか？ローカルサーバー経由（例: python3 -m http.server）で開いてください。';
      el.prepend(notice);
    }
  }

  return { init, switchTab, updateBadges };
})();

if (typeof window !== 'undefined') {
  window.TapuUI_Main = TapuUI_Main;
  document.addEventListener('DOMContentLoaded', () => {
    TapuUI_Main.init();
  });
}
