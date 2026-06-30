const STORAGE_KEY = 'tup_favorite_podcasts';

export function getFavoritePodcasts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isFavoritePodcast(slug) {
  if (!slug) return false;
  return getFavoritePodcasts().some((p) => p.slug === slug);
}

export function toggleFavoritePodcast(post) {
  const slug = post?.slug;
  if (!slug) return { saved: false, list: getFavoritePodcasts() };

  const list = getFavoritePodcasts();
  const idx = list.findIndex((p) => p.slug === slug);
  let saved;

  if (idx >= 0) {
    list.splice(idx, 1);
    saved = false;
  } else {
    list.unshift({
      slug,
      title: post.title || 'Podcast',
      author_name: post.author_name || '',
      featured_image: post.featured_image || '',
      audio_url: post.audio_url || '',
      saved_at: Date.now(),
    });
    saved = true;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  window.dispatchEvent(new CustomEvent('favorite-podcasts-changed'));
  return { saved, list: getFavoritePodcasts() };
}

export function removeFavoritePodcast(slug) {
  if (!slug) return getFavoritePodcasts();
  const list = getFavoritePodcasts().filter((p) => p.slug !== slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('favorite-podcasts-changed'));
  return list;
}
