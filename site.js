// Equal-width masonry: preserve photo order and each original aspect ratio.
function planGallery(ratios, width, gap) {
  const columns = width <= 500 ? 2 : 3;
  const columnWidth = (width - gap * (columns - 1)) / columns;
  const bottoms = Array(columns).fill(0);
  const items = ratios.map(ratio => {
    const shortest = Math.min(...bottoms);
    // Treat tiny scan-size differences as a tie, keeping rows left to right.
    const column = bottoms.findIndex(bottom => bottom <= shortest + 2);
    const height = columnWidth / ratio;
    const item = {left: column * (columnWidth + gap), top: bottoms[column], width: columnWidth, height};
    bottoms[column] += height + gap;
    return item;
  });
  return {items, height: items.length ? Math.max(...bottoms) - gap : 0};
}

// Ignore taps, mostly vertical gestures, and long holds.
function swipeStep(dx, dy, elapsed) {
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5 || elapsed > 1200) return 0;
  return dx < 0 ? 1 : -1;
}

const onAbout = location.pathname.endsWith('/about.html');
const nav = document.getElementById('albums');
for (const album of albums) {
  const link = document.createElement('a');
  link.textContent = album.name;
  link.href = `index.html#${album.id}`;
  link.dataset.album = album.id;
  nav.append(link);
}
if (onAbout) {
  document.querySelector('.about-link').setAttribute('aria-current', 'page');
} else {
  let album, index = 0, gridOpen = false;
  const photo = document.getElementById('photo');
  const grid = document.getElementById('grid');
  const gallery = document.querySelector('.gallery');
  const toggle = document.getElementById('grid-toggle');
  const nameTitle = document.querySelector('.name');
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--mobile-photo-height', `${photo.getBoundingClientRect().height}px`);
  }).observe(photo);

  function updatePhotoArea() {
    document.documentElement.style.setProperty('--name-right', `${nameTitle.getBoundingClientRect().right}px`);
  }
  new ResizeObserver(updatePhotoArea).observe(nameTitle);
  window.addEventListener('resize', updatePhotoArea);
  document.fonts.ready.then(updatePhotoArea);
  updatePhotoArea();

  function showPhoto() {
    photo.src = album.photos[index];
    photo.alt = `${album.name}, photograph ${index + 1}`;
    document.getElementById('photo-status').textContent = `${album.name}: photograph ${index + 1} of ${album.photos.length}`;
    // Warm the next image without downloading every full-size photograph.
    const preload = new Image();
    preload.src = album.photos[(index + 1) % album.photos.length];
  }
  let lastGalleryWidth = 0;
  function layoutGallery() {
    if (!gridOpen || !grid.clientWidth) return;
    const width = grid.clientWidth;
    const gap = width <= 600 ? 12 : 18;
    const ratios = album.sizes.map(([w, h]) => w / h);
    const layout = planGallery(ratios, width, gap);
    layout.items.forEach((item, i) => {
      Object.assign(grid.children[i].style, {
        left: `${item.left}px`, top: `${item.top}px`,
        width: `${item.width}px`, height: `${item.height}px`
      });
    });
    grid.style.height = `${layout.height}px`;
    lastGalleryWidth = width;
  }
  new ResizeObserver(() => {
    if (grid.clientWidth !== lastGalleryWidth) layoutGallery();
  }).observe(grid);
  function setGrid(open) {
    gridOpen = open;
    grid.hidden = !open;
    gallery.hidden = open;
    toggle.setAttribute('aria-expanded', String(open));
    document.querySelector('.gallery-controls').hidden = open;
    toggle.setAttribute('aria-label', 'View album gallery');
    toggle.querySelector('span').textContent = 'show gallery';
    document.getElementById('previous').disabled = open;
    document.getElementById('next').disabled = open;
    if (open) layoutGallery();
  }
  function selectAlbum() {
    album = albums.find(a => a.id === location.hash.slice(1)) || albums.find(a => a.id === 'albania');
    index = 0;
    setGrid(false);
    document.title = `${album.name} — Saumit Madireddy`;
    for (const link of nav.children) {
      if (link.dataset.album === album.id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    grid.replaceChildren();
    album.photos.forEach((src, number) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Open ${album.name}, photograph ${number + 1}`);
      const image = document.createElement('img');
      image.src = src;
      image.alt = `${album.name}, photograph ${number + 1}`;
      image.loading = 'lazy';
      image.decoding = 'async';
      [image.width, image.height] = album.sizes[number];
      button.append(image);
      button.addEventListener('click', () => { index = number; setGrid(false); showPhoto(); toggle.focus({preventScroll: true}); window.scrollTo(0, 0); });
      grid.append(button);
    });
    showPhoto();
  }
  const stage = document.querySelector('.photo-stage');
  let swipeStart = null;
  stage.addEventListener('touchstart', event => {
    swipeStart = !gridOpen && event.touches.length === 1
      ? {x: event.touches[0].clientX, y: event.touches[0].clientY, time: event.timeStamp}
      : null;
  }, {passive: true});
  stage.addEventListener('touchmove', event => {
    if (event.touches.length !== 1) swipeStart = null;
  }, {passive: true});
  stage.addEventListener('touchcancel', () => { swipeStart = null; }, {passive: true});
  stage.addEventListener('touchend', event => {
    const start = swipeStart;
    swipeStart = null;
    if (!start || gridOpen || event.touches.length || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const step = swipeStep(touch.clientX - start.x, touch.clientY - start.y, event.timeStamp - start.time);
    if (step) {
      index = (index + step + album.photos.length) % album.photos.length;
      showPhoto();
    }
  }, {passive: true});
  document.getElementById('previous').addEventListener('click', () => { index = (index - 1 + album.photos.length) % album.photos.length; showPhoto(); });
  document.getElementById('next').addEventListener('click', () => { index = (index + 1) % album.photos.length; showPhoto(); });
  toggle.addEventListener('click', () => { setGrid(!gridOpen); if (gridOpen) grid.querySelector('button').focus({preventScroll: true}); });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select')) return;
    if (!gridOpen && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      index = (index + (event.key === 'ArrowRight' ? 1 : -1) + album.photos.length) % album.photos.length;
      showPhoto();
    }
  });
  nav.addEventListener('click', event => {
    const link = event.target.closest('a[data-album]');
    if (link && link.dataset.album === album.id) {
      event.preventDefault();
      selectAlbum();
      window.scrollTo(0, 0);
    }
  });
  window.addEventListener('hashchange', selectAlbum);
  selectAlbum();
}
