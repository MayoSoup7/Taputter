/*
 * ui-notify.js
 * -----------------------------------------------------------------------
 * 通知タブの描画と、プレイヤーが投稿した時のバズ/炎上イベント発火を
 * 担当します。イベントの中身自体は notifications.js が生成します。
 * -----------------------------------------------------------------------
 */

const TapuUI_Notify = (() => {
  function notifItemHTML(n) {
    const unreadClass = n.read ? '' : 'tsns-unread';
    const clickableClass = n.postId ? 'tsns-notif-clickable' : '';
    return `
      <div class="tsns-notif-item ${unreadClass} ${clickableClass}" ${n.postId ? `data-post-id="${n.postId}"` : ''}>
        <div class="tsns-notif-icon">${TapuUtils.escapeHtml(n.icon || '🍡')}</div>
        <div class="tsns-notif-text">${TapuUtils.formatContent(n.text)}</div>
        <div class="tsns-notif-time">${TapuUtils.formatTime(n.createdAt)}</div>
      </div>`;
  }

  function renderNotifications() {
    const el = document.getElementById('tsns-notif-list');
    if (!el) return;
    const list = TapuSNS_State.getNotifications();
    el.innerHTML = list.length > 0
      ? list.map(notifItemHTML).join('')
      : '<div class="tsns-empty">通知はまだありません</div>';

    el.querySelectorAll('.tsns-notif-clickable').forEach(item => {
      item.addEventListener('click', () => jumpToPost(item.dataset.postId));
    });
  }

  function jumpToPost(postId) {
    if (!postId || !window.TapuUI_Main) return;
    window.TapuUI_Main.switchTab('home');
    setTimeout(() => {
      const card = document.querySelector(`#tsns-timeline .tsns-card[data-post-id="${postId}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('tsns-highlight-flash');
        setTimeout(() => card.classList.remove('tsns-highlight-flash'), 1600);
      }
    }, 80);
  }

  // ホームで投稿した時に呼ばれる。バズ/炎上/ちょっと反応 をランダム判定して
  // 時間差で通知を追加していく。あわせて対象投稿のいいね/リプ数も
  // 通知が届くタイミングに合わせて段階的に増やす。
  function triggerPostEvent(postId, forceTier) {
    if (!window.TapuNotifyEngine) return;
    const { tier, events, statsDelta } = window.TapuNotifyEngine.rollForPost(forceTier);
    if (events.length === 0) return;

    // 対象ツイートの本文を短く引用できるように取得しておく
    const targetPost = postId ? TapuSNS_State.getPosts().find(p => p.id === postId) : null;
    const quote = targetPost ? TapuUtils.quoteSnippet(targetPost.content) : '';

    // 合計増加量を各通知イベントのタイミングに分配する
    const n = events.length;
    const likeChunks = splitInteger(statsDelta.likes, n);
    const replyChunks = splitInteger(statsDelta.replies, n);
    const rtChunks = splitInteger(statsDelta.retweets || 0, n);

    events.forEach((ev, i) => {
      setTimeout(() => {
        const notifText = ev.text.split('{quote}').join(quote);
        TapuSNS_State.addNotification({ text: notifText, icon: ev.icon, postId: postId || null });

        if (postId && (tier === 'buzz' || tier === 'enjou') && i === 0) {
          TapuSNS_State.setPostStatus(postId, tier);
        }
        if (postId && (likeChunks[i] || replyChunks[i] || rtChunks[i])) {
          TapuSNS_State.addPostEngagement(postId, { likes: likeChunks[i], replies: replyChunks[i], retweets: rtChunks[i] });
        }

        // リプライ型のイベントは、実際にそのツイートへコメントとして残す
        if (ev.isReply && postId && ev.replyText != null) {
          const replyFilled = ev.replyText.split('{quote}').join(quote);
          TapuSNS_State.addReplyToPost(postId, replyFilled, null, { name: ev.persona });
        }

        updateBadge();
        refreshVisiblePanels();
      }, ev.delayMs);
    });

    // バズ/炎上は台本のやり取りだけだと勢いが物足りないので、
    // その後に「盛り上がってる感」の軽い通知を連続で流し、
    // 最後に投稿のステータスを「終了」に切り替える
    if (tier === 'buzz' || tier === 'enjou') {
      const lastDelay = Math.max(...events.map(e => e.delayMs));
      const floodCount = tier === 'buzz' ? (8 + Math.floor(Math.random() * 8)) : (4 + Math.floor(Math.random() * 6));
      let cursor = lastDelay + 500;

      for (let i = 0; i < floodCount; i++) {
        cursor += 350 + Math.random() * (tier === 'buzz' ? 700 : 1000);
        setTimeout(() => {
          const line = window.TapuNotifyEngine.randomMinorLine();
          if (line) {
            TapuSNS_State.addNotification({ text: line.text, icon: line.icon, postId: postId || null });
            updateBadge();
            refreshVisiblePanels();
          }
        }, cursor);
      }

      const endedAt = cursor + 1500;
      setTimeout(() => {
        if (postId) {
          TapuSNS_State.setPostStatus(postId, tier + '_ended');
          TapuSNS_State.addNotification({
            text: tier === 'buzz' ? '🎉「' + quote + '」のバズが落ち着いてきました' : '🕊️「' + quote + '」の炎上が収まりました',
            icon: tier === 'buzz' ? '🎉' : '🕊️',
            postId,
          });
          updateBadge();
          refreshVisiblePanels();
        }
      }, endedAt);
    }
  }

  function refreshVisiblePanels() {
    const notifyPanel = document.getElementById('tsns-panel-notify');
    if (notifyPanel && !notifyPanel.classList.contains('tsns-hidden')) {
      renderNotifications();
    }
    const homePanel = document.getElementById('tsns-panel-home');
    if (homePanel && !homePanel.classList.contains('tsns-hidden') && window.TapuUI_Home) {
      window.TapuUI_Home.renderTimeline();
    }
    if (window.TapuUI_Profile) window.TapuUI_Profile.renderTapuProfile();
  }

  // 合計値をn個にできるだけ均等に分配する（端数は最後にまとめる）
  function splitInteger(total, n) {
    if (n <= 0) return [];
    const base = Math.floor(total / n);
    const remainder = total - base * n;
    const arr = new Array(n).fill(base);
    if (remainder > 0) arr[n - 1] += remainder;
    return arr;
  }

  function updateBadge() {
    if (window.TapuUI_Main) window.TapuUI_Main.updateBadges();
  }

  return { renderNotifications, triggerPostEvent };
})();

if (typeof window !== 'undefined') {
  window.TapuUI_Notify = TapuUI_Notify;
}
