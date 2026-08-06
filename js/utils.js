/*
 * utils.js
 * -----------------------------------------------------------------------
 * HTMLエスケープ、時刻フォーマット、アバター描画など、
 * どのファイルからも使う小さな共通関数をまとめています。
 * -----------------------------------------------------------------------
 */

const TapuUtils = (() => {
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 本文中の #ハッシュタグ を強調しつつ改行を保持
  function formatContent(text) {
    const escaped = escapeHtml(text);
    return escaped.replace(/(#[^\s#]+)/g, '<span class="tsns-hashtag">$1</span>');
  }

  function formatTime(ts) {
    const diffMs = Date.now() - ts;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'たった今';
    if (diffMin < 60) return `${diffMin}分前`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}時間前`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}日前`;
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function formatClock(ts) {
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  // 大きな数字を「1.2万」のように短く表示する
  function formatCount(n) {
    n = n || 0;
    if (n >= 10000) {
      const man = n / 10000;
      return (Number.isInteger(man) ? man : man.toFixed(1)) + '万';
    }
    if (n >= 1000) return n.toLocaleString();
    return String(n);
  }

  // キャラクター（またはプレイヤー）のアバターHTMLを生成
  // icon画像があればimg、なければ絵文字/頭文字を色付き円で表示
  function avatarHTML(character, size = 'md') {
    if (!character) character = { name: '?', color: '#ccc' };
    const style = `background:${character.color || '#ccc'};`;
    if (character.icon) {
      return `<div class="tsns-avatar ${size}" style="${style}"><img src="${escapeHtml(character.icon)}" alt=""></div>`;
    }
    const initial = (character.role === 'tapu' || character.role === 'player') ? '🍡' : (character.name ? character.name.charAt(0) : '?');
    return `<div class="tsns-avatar ${size}" style="${style}">${escapeHtml(initial)}</div>`;
  }

  // プレイヤー自身のアバター（stateのprofileから）
  function playerAvatarHTML(size = 'md') {
    const profile = window.TapuSNS_State.getProfile();
    const style = 'background:#ff8dc7;';
    if (profile.icon) {
      return `<div class="tsns-avatar ${size}" style="${style}"><img src="${escapeHtml(profile.icon)}" alt=""></div>`;
    }
    return `<div class="tsns-avatar ${size}" style="${style}">🍡</div>`;
  }

  function getAuthor(authorId) {
    if (authorId === 'player') {
      const profile = window.TapuSNS_State.getProfile();
      return { id: 'player', name: profile.name, handle: profile.handle, icon: profile.icon, color: '#ff8dc7', role: 'player' };
    }
    return window.TapuSNS_Config.CHARACTERS[authorId] || { id: authorId, name: '名無し', handle: '', color: '#ccc', role: 'other' };
  }

  // 通知等でツイート内容を短く引用するためのヘルパー
  function quoteSnippet(text, maxLen = 18) {
    if (!text) return '';
    const oneLine = String(text).replace(/\s+/g, ' ').trim();
    return oneLine.length > maxLen ? oneLine.slice(0, maxLen) + '…' : oneLine;
  }

  return { escapeHtml, formatContent, formatTime, formatClock, formatCount, avatarHTML, playerAvatarHTML, getAuthor, quoteSnippet };
})();

if (typeof window !== 'undefined') {
  window.TapuUtils = TapuUtils;
}
