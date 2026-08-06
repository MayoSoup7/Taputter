/*
 * ui-profile.js
 * -----------------------------------------------------------------------
 * 「たぷ」プロフィール画面の投稿一覧表示と、「マイページ」の
 * プロフィール編集（名前・呼び方・アイコン等）を担当します。
 * -----------------------------------------------------------------------
 */

const TapuUI_Profile = (() => {
  function renderTapuProfile() {
    const el = document.getElementById('tsns-tapu-posts');
    if (!el) return;
    const posts = TapuSNS_State.getPosts().filter(p => p.authorId === 'tapu');
    el.innerHTML = posts.length > 0
      ? posts.map(window.TapuUI_Home.tweetCardHTML).join('')
      : '<div class="tsns-empty">まだ投稿がありません</div>';
    window.TapuUI_Home.bindCardEvents(el);
  }

  function renderMyPosts() {
    const el = document.getElementById('tsns-my-posts');
    if (!el) return;

    const myPosts = TapuSNS_State.getPosts()
      .filter(p => p.authorId === 'player')
      .map(p => ({ post: p, isRetweet: false, sortKey: p.createdAt }));

    const retweeted = TapuSNS_State.getMyRetweetedPosts()
      .map(({ post, retweetedAt }) => ({ post, isRetweet: true, sortKey: retweetedAt }));

    const combined = [...myPosts, ...retweeted].sort((a, b) => b.sortKey - a.sortKey);

    el.innerHTML = combined.length > 0
      ? combined.map(item => {
          if (item.isRetweet) {
            const profile = TapuSNS_State.getProfile();
            return `<div class="tsns-retweet-label">🔁 ${TapuUtils.escapeHtml(profile.name)}がリツイート</div>` + window.TapuUI_Home.tweetCardHTML(item.post);
          }
          return window.TapuUI_Home.tweetCardHTML(item.post);
        }).join('')
      : '<div class="tsns-empty">まだ投稿がありません</div>';
    window.TapuUI_Home.bindCardEvents(el);
  }

  function loadMyProfileForm() {
    const p = TapuSNS_State.getProfile();
    document.getElementById('tsns-input-name').value = p.name || '';
    document.getElementById('tsns-input-handle').value = p.handle || '';
    document.getElementById('tsns-input-bio').value = p.bio || '';
    document.getElementById('tsns-input-nickname').value = p.nickname || p.name || '';
    updateAvatarPreview(p.icon);
    renderMyPosts();
  }

  function updateAvatarPreview(iconDataUrl) {
    const preview = document.getElementById('tsns-my-avatar-preview');
    if (iconDataUrl) {
      preview.innerHTML = `<img src="${iconDataUrl}" alt="">`;
    } else {
      preview.innerHTML = '';
      preview.textContent = '🍡';
    }
  }

  function handleAvatarFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateAvatarPreview(reader.result);
      updateAvatarPreview.pendingIcon = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function saveProfile() {
    const name = document.getElementById('tsns-input-name').value.trim() || 'おもち';
    const handle = document.getElementById('tsns-input-handle').value.trim() || '@omochi_fan';
    const bio = document.getElementById('tsns-input-bio').value.trim();
    const nickname = document.getElementById('tsns-input-nickname').value.trim() || name;
    const preview = document.getElementById('tsns-my-avatar-preview');
    const img = preview.querySelector('img');
    const icon = img ? img.getAttribute('src') : '';

    TapuSNS_State.updateProfile({ name, handle, bio, nickname, icon });

    const btn = document.getElementById('tsns-save-profile');
    const original = btn.textContent;
    btn.textContent = '保存しました！';
    btn.classList.add('tsns-save-ok');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('tsns-save-ok');
    }, 1200);

    // タイムライン等の表示名を即座に反映
    if (window.TapuUI_Home) window.TapuUI_Home.renderTimeline();
    renderMyPosts();
  }

  function bindEvents() {
    document.getElementById('tsns-save-profile').addEventListener('click', saveProfile);
    document.getElementById('tsns-avatar-file').addEventListener('change', handleAvatarFile);
    document.getElementById('tsns-input-name').addEventListener('input', () => {
      const preview = document.getElementById('tsns-my-avatar-preview');
      if (!preview.querySelector('img')) updateAvatarPreview(null);
    });
  }

  return { renderTapuProfile, loadMyProfileForm, renderMyPosts, bindEvents };
})();

if (typeof window !== 'undefined') {
  window.TapuUI_Profile = TapuUI_Profile;
}
