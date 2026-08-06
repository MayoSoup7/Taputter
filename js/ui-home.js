/*
 * ui-home.js
 * -----------------------------------------------------------------------
 * ホームタブ：タイムライン表示、投稿、いいね、リプライモーダルを担当します。
 * -----------------------------------------------------------------------
 */

const TapuUI_Home = (() => {
  let replyTargetPostId = null;

  function tweetCardHTML(post) {
    const author = TapuUtils.getAuthor(post.authorId);
    const liked = TapuSNS_State.isLiked(post.id);
    const likedClass = liked ? 'tsns-liked' : '';
    const retweeted = TapuSNS_State.isRetweeted(post.id);
    const retweetedClass = retweeted ? 'tsns-retweeted' : '';
    const avatarHTML = TapuUtils.avatarHTML(author, 'md');
    const verifiedBadge = post.authorId === 'tapu' ? '<span class="tsns-verified">✓</span>' : '';
    const timeStr = TapuUtils.formatTime(post.createdAt);

    const statusClass = post.status === 'buzz' ? 'tsns-status-buzz'
      : (post.status === 'enjou' ? 'tsns-status-enjou'
      : (post.status === 'buzz_ended' || post.status === 'enjou_ended' ? 'tsns-status-ended' : ''));
    const statusBadge = post.status === 'buzz'
      ? '<span class="tsns-status-badge tsns-badge-buzz">🎉 バズ中</span>'
      : post.status === 'enjou'
      ? '<span class="tsns-status-badge tsns-badge-enjou">🔥 炎上中</span>'
      : post.status === 'buzz_ended'
      ? '<span class="tsns-status-badge tsns-badge-ended">🎉 バズ終了</span>'
      : post.status === 'enjou_ended'
      ? '<span class="tsns-status-badge tsns-badge-ended">🔥 炎上終了</span>'
      : '';

    const repliesHTML = (post.replies && post.replies.length > 0) ? `
      <div class="tsns-reply-area">
        ${post.replies.map(r => {
          if (r.authorName) {
            // 登録キャラではない、通知イベント由来の任意ペルソナ（アンチ/ファン等）
            return `
              <div class="tsns-reply-item">
                <div class="tsns-avatar sm" style="background:#adb5bd;">${TapuUtils.escapeHtml(r.authorName.charAt(0))}</div>
                <div class="tsns-reply-body">
                  <div class="tsns-reply-name">${TapuUtils.escapeHtml(r.authorName)} <span style="color:#bbb;font-size:10px;">${TapuUtils.escapeHtml(r.authorHandle || '')}</span></div>
                  <div class="tsns-reply-text">${TapuUtils.formatContent(r.text)}</div>
                </div>
              </div>`;
          }
          const rc = TapuUtils.getAuthor(r.authorId);
          return `
            <div class="tsns-reply-item">
              ${TapuUtils.avatarHTML(rc, 'sm')}
              <div class="tsns-reply-body">
                <div class="tsns-reply-name">${TapuUtils.escapeHtml(rc.name)} <span style="color:#bbb;font-size:10px;">${TapuUtils.escapeHtml(rc.handle || '')}</span></div>
                <div class="tsns-reply-text">${TapuUtils.formatContent(r.text)}</div>
              </div>
            </div>`;
        }).join('')}
      </div>` : '';

    return `
      <div class="tsns-card ${statusClass}" data-post-id="${post.id}">
        <div class="tsns-card-header">
          ${avatarHTML}
          <div class="tsns-user-col">
            <div class="tsns-display-name">${TapuUtils.escapeHtml(author.name)}${verifiedBadge}</div>
            <div class="tsns-handle">${TapuUtils.escapeHtml(author.handle || '')}</div>
          </div>
          <div class="tsns-time">${timeStr}</div>
        </div>
        ${statusBadge}
        <div class="tsns-body">${TapuUtils.formatContent(post.content)}</div>
        <div class="tsns-actions">
          <button class="tsns-act-btn tsns-like-btn ${likedClass}" data-post-id="${post.id}">
            <span class="tsns-heart">❤️</span><span class="tsns-like-count">${TapuUtils.formatCount(post.likes)}</span>
          </button>
          <button class="tsns-act-btn tsns-reply-btn" data-post-id="${post.id}">
            💬<span>${TapuUtils.formatCount(post.replyCount)}</span>
          </button>
          <button class="tsns-act-btn tsns-rt-btn ${retweetedClass}" data-post-id="${post.id}">
            🔁<span class="tsns-rt-count">${TapuUtils.formatCount(post.retweetCount)}</span>
          </button>
        </div>
        ${repliesHTML}
      </div>`;
  }

  function renderTimeline() {
    const el = document.getElementById('tsns-timeline');
    if (!el) return;
    const posts = TapuSNS_State.getPosts();
    el.innerHTML = posts.length > 0
      ? posts.map(tweetCardHTML).join('')
      : '<div class="tsns-empty">投稿がありません</div>';
    bindCardEvents(el);
  }

  function bindCardEvents(container) {
    container.querySelectorAll('.tsns-reply-btn').forEach(btn => {
      btn.addEventListener('click', () => openReplyModal(btn.dataset.postId));
    });
    container.querySelectorAll('.tsns-like-btn').forEach(btn => {
      btn.addEventListener('click', () => toggleLike(btn, btn.dataset.postId));
    });
    container.querySelectorAll('.tsns-rt-btn').forEach(btn => {
      btn.addEventListener('click', () => toggleRetweet(btn, btn.dataset.postId));
    });
  }

  function toggleRetweet(btn, postId) {
    const result = TapuSNS_State.toggleRetweet(postId);
    if (!result) return;
    btn.classList.toggle('tsns-retweeted', result.retweeted);
    btn.querySelector('.tsns-rt-count').textContent = TapuUtils.formatCount(result.retweetCount);
    if (window.TapuUI_Profile) window.TapuUI_Profile.renderMyPosts();
  }

  function toggleLike(btn, postId) {
    const result = TapuSNS_State.toggleLike(postId);
    if (!result) return;
    btn.classList.toggle('tsns-liked', result.liked);
    btn.querySelector('.tsns-like-count').textContent = TapuUtils.formatCount(result.likes);
    if (result.liked) window.TapuSound.play('Bell3');
  }

  function openReplyModal(postId) {
    replyTargetPostId = postId;
    const post = TapuSNS_State.getPosts().find(p => p.id === postId);
    if (!post) return;
    const author = TapuUtils.getAuthor(post.authorId);
    const modal = document.getElementById('tsns-reply-modal');
    const original = document.getElementById('tsns-reply-original');
    original.innerHTML = `
      <div class="tsns-card-header" style="margin-bottom:8px;">
        ${TapuUtils.avatarHTML(author, 'sm')}
        <div class="tsns-user-col">
          <div class="tsns-display-name">${TapuUtils.escapeHtml(author.name)}</div>
          <div class="tsns-handle">${TapuUtils.escapeHtml(author.handle || '')}</div>
        </div>
      </div>
      <div class="tsns-body" style="font-size:14px;">${TapuUtils.formatContent(post.content)}</div>
    `;
    document.getElementById('tsns-reply-textarea').value = '';
    modal.classList.remove('tsns-hidden');
    document.getElementById('tsns-reply-textarea').focus();
  }

  function closeReplyModal() {
    document.getElementById('tsns-reply-modal').classList.add('tsns-hidden');
    replyTargetPostId = null;
  }

  function submitReply() {
    const ta = document.getElementById('tsns-reply-textarea');
    const text = ta.value.trim();
    if (!text || !replyTargetPostId) return;
    const targetPost = TapuSNS_State.getPosts().find(p => p.id === replyTargetPostId);

    TapuSNS_State.addReplyToPost(replyTargetPostId, text);
    window.TapuSound.play('Decision3');
    closeReplyModal();
    renderTimeline();

    // どのキャラの投稿へのリプライでも、その本人から適当な相槌が返ってくる
    if (targetPost && Math.random() < 0.7) {
      scheduleAuthorQuickReply(targetPost.id, targetPost.authorId);
    }
  }

  async function scheduleAuthorQuickReply(postId, authorId) {
    const pool = authorId === 'tapu'
      ? (window.TAPU_QUICK_REPLIES || ['ありがと〜！🍡'])
      : (window.GENERIC_QUICK_REPLIES || ['それな']);
    const text = pool[Math.floor(Math.random() * pool.length)];
    const delay = 900 + Math.random() * 2200;
    await new Promise(res => setTimeout(res, delay));
    TapuSNS_State.addReplyToPost(postId, text, authorId);
    renderTimeline();
    if (window.TapuUI_Profile) {
      window.TapuUI_Profile.renderTapuProfile();
      window.TapuUI_Profile.renderMyPosts();
    }
  }

  // 後方互換用（既存コードからの呼び出し名を維持）
  function scheduleTapuQuickReply(postId) {
    return scheduleAuthorQuickReply(postId, 'tapu');
  }

  function submitPost() {
    const input = document.getElementById('tsns-post-input');
    const sendBtn = document.getElementById('tsns-post-send');
    const tierSelect = document.getElementById('tsns-post-tier-select');
    const text = input.value.trim();
    if (!text) return;

    const forceTier = tierSelect && tierSelect.value ? tierSelect.value : undefined;

    const newPost = TapuSNS_State.addPlayerPost(text);
    input.value = '';
    input.style.height = 'auto';
    renderTimeline();
    window.TapuSound.play('Book2');

    sendBtn.textContent = '投稿完了！';
    setTimeout(() => { sendBtn.textContent = '投稿'; }, 900);

    // バズ/炎上イベント判定（notify-ui.js側で処理、いいね/リプ数もここで連動する）
    if (window.TapuUI_Notify) window.TapuUI_Notify.triggerPostEvent(newPost.id, forceTier);

    // 一定確率で、たぷ本人からも短いリプがつく
    if (Math.random() < 0.45) {
      scheduleTapuQuickReply(newPost.id);
    }
  }

  let toastTimer = null;
  function showToast(text) {
    const el = document.getElementById('tsns-toast');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('tsns-hidden');
    // 1フレーム待ってからクラス付与しないとtransitionが効かないことがあるため
    requestAnimationFrame(() => el.classList.add('tsns-toast-show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('tsns-toast-show');
      setTimeout(() => el.classList.add('tsns-hidden'), 300);
    }, 2200);
  }

  function bindEvents() {
    const input = document.getElementById('tsns-post-input');
    const sendBtn = document.getElementById('tsns-post-send');

    sendBtn.addEventListener('click', submitPost);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitPost(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    document.getElementById('tsns-reply-close').addEventListener('click', closeReplyModal);
    document.getElementById('tsns-reply-post-btn').addEventListener('click', submitReply);
    const replyTA = document.getElementById('tsns-reply-textarea');
    replyTA.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); submitReply(); }
    });

    document.getElementById('tsns-image-viewer').addEventListener('click', () => {
      document.getElementById('tsns-image-viewer').classList.add('tsns-hidden');
    });

    const refreshBtn = document.getElementById('tsns-tl-refresh-btn');
    const logoIcon = document.getElementById('tsns-logo-icon');
    refreshBtn.addEventListener('click', () => {
      if (!window.TapuEngagement || refreshBtn.disabled) return;
      refreshBtn.disabled = true;
      logoIcon.classList.add('tsns-spin');
      setTimeout(() => {
        const count = window.TapuEngagement.forceRefreshTimeline();
        logoIcon.classList.remove('tsns-spin');
        refreshBtn.disabled = false;
        window.TapuSound.play('Decision1');
        showToast(count > 0 ? `🔄 新着 ${count}件！` : '新着はありませんでした');
      }, 600);
    });
  }

  return { renderTimeline, bindEvents, tweetCardHTML, bindCardEvents };
})();

if (typeof window !== 'undefined') {
  window.TapuUI_Home = TapuUI_Home;
}
