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
const onTmi = location.pathname.endsWith('/tmi.html');
const onVideo = location.pathname.endsWith('/video.html');
if (onTmi) {
  const name = document.querySelector('.name');
  const alignTmiArea = () => document.documentElement.style.setProperty('--name-right', `${name.getBoundingClientRect().right}px`);
  new ResizeObserver(alignTmiArea).observe(name);
  window.addEventListener('resize', alignTmiArea);
  document.fonts.ready.then(alignTmiArea);
  alignTmiArea();
  const typing = document.querySelector('.sleeping-typing');
  const dots = document.querySelector('.sleeping-dots');
  const reserve = document.querySelector('.sleeping-reserve');
  const paragraph = document.querySelector('.sleeping-message');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let typingTimer;
  function typeMessage(target, message, trailingDots = false, delay = 300) {
    window.clearTimeout(typingTimer);
    dots.textContent = '';
    target.textContent = '';
    let letter = 0;
    const typeDot = () => {
      if (dots.textContent.length < 512) dots.textContent += '.';
      typingTimer = window.setTimeout(typeDot, 220);
    };
    const typeLetter = () => {
      target.textContent = message.slice(0, ++letter);
      if (letter < message.length) typingTimer = window.setTimeout(typeLetter, 75);
      else if (trailingDots) typeDot();
    };
    if (reducedMotion) {
      target.textContent = message;
      if (trailingDots) dots.textContent = '.........';
    } else typingTimer = window.setTimeout(typeLetter, delay);
  }
  typeMessage(typing, 'saumit is sleeping right now', true);
  let clicks = 0;
  let darknessScene = null;
  let starsReady = false;
  let starClicks = 0;
  function shootStar(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.hypot(window.innerWidth, window.innerHeight) + 120;
    const star = document.createElement('span');
    star.className = 'tmi-shooting-star';
    star.setAttribute('aria-hidden', 'true');
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    star.style.setProperty('--star-x', `${Math.cos(angle) * distance}px`);
    star.style.setProperty('--star-y', `${Math.sin(angle) * distance}px`);
    star.style.setProperty('--star-angle', `${angle}rad`);
    star.style.setProperty('--star-duration', `${900 + Math.random() * 700}ms`);
    darknessScene.append(star);
    star.addEventListener('animationend', () => star.remove(), {once: true});
    window.setTimeout(() => star.remove(), 2000);
  }
  document.addEventListener('click', event => {
    if (darknessScene) {
      if (!starsReady) return;
      starClicks += 1;
      if (starClicks <= 5) shootStar(event.clientX, event.clientY);
      else window.location.assign('index.html');
      return;
    }
    clicks += 1;
    if (clicks === 5) {
      const message = 'it sounds like a jet engine right now. he snores so loud. you will not wake him up.';
      paragraph.classList.add('sleeping-expanded');
      paragraph.setAttribute('aria-label', message);
      reserve.textContent = message;
      typeMessage(typing, message);
    } else if (clicks === 10) {
      const message = 'this is what he sees. nothing but darkness.';
      const darkness = document.createElement('div');
      darkness.className = 'tmi-darkness';
      darkness.setAttribute('role', 'status');
      darkness.setAttribute('aria-label', '');
      const text = document.createElement('p');
      text.setAttribute('aria-hidden', 'true');
      darkness.append(text);
      document.body.append(darkness);
      document.documentElement.classList.add('tmi-is-dark');
      window.scrollTo(0, 0);
      darknessScene = darkness;
      window.clearTimeout(typingTimer);
      window.setTimeout(() => {
        darkness.setAttribute('aria-label', message);
        typeMessage(text, message, false, 0);
        starsReady = true;
      }, 5000);
    }
  });
}
const nav = document.getElementById('albums');
for (const album of albums) {
  const link = document.createElement('a');
  link.textContent = album.name;
  link.href = `index.html#${album.id}`;
  link.dataset.album = album.id;
  nav.append(link);
}
const videoLink = document.createElement('a');
videoLink.textContent = 'Video';
videoLink.href = 'video.html';
videoLink.className = 'video-link';
if (onVideo) videoLink.setAttribute('aria-current', 'page');
nav.append(videoLink);
const desktopMenuSwitch = document.querySelector('.desktop-menu-switch');
const desktopPersonalLinks = document.querySelector('.desktop-personal-links');
function setDesktopPersonalLinks(open) {
  desktopPersonalLinks.hidden = !open;
  desktopMenuSwitch.setAttribute('aria-expanded', String(open));
  desktopMenuSwitch.setAttribute('aria-label', open ? 'Hide personal links' : 'Show personal links');
}
setDesktopPersonalLinks(onAbout || onTmi);
desktopMenuSwitch.addEventListener('click', () => setDesktopPersonalLinks(desktopPersonalLinks.hidden));
const menuSwitch = document.querySelector('.menu-switch');
function sizeLandscapeSwitch() {
  const title = nav.querySelector('[data-album="new-york"]');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = getComputedStyle(title).font;
  document.documentElement.style.setProperty('--landscape-switch-width', `${Math.ceil(context.measureText(title.textContent).width)}px`);
}
window.addEventListener('resize', sizeLandscapeSwitch);
document.fonts.ready.then(sizeLandscapeSwitch);

function setPersonalMenu(open) {
  document.body.dataset.personalMenu = String(open);
  menuSwitch.setAttribute('aria-pressed', String(open));
  menuSwitch.setAttribute('aria-label', open ? 'Show photo albums' : 'Show personal links');
}
setPersonalMenu(onAbout || onTmi || onVideo);
menuSwitch.addEventListener('click', () => setPersonalMenu(document.body.dataset.personalMenu !== 'true'));

if (onAbout || onTmi || onVideo) {
  if (onAbout) document.querySelector('.about-link').setAttribute('aria-current', 'page');
  if (onTmi) document.querySelector('[data-desktop-page="tmi"]').setAttribute('aria-current', 'page');
  document.querySelector(`[data-page="${onVideo ? 'video' : onAbout ? 'about' : 'tmi'}"]`).setAttribute('aria-current', 'page');
} else {
  let album, index = 0, gridOpen = false;
  const photo = document.getElementById('photo');
  const grid = document.getElementById('grid');
  const gallery = document.querySelector('.gallery');
  const toggle = document.getElementById('grid-toggle');
  const nameTitle = document.querySelector('.name');

  function updatePhotoArea() {
    document.documentElement.style.setProperty('--name-right', `${nameTitle.getBoundingClientRect().right}px`);
  }
  new ResizeObserver(updatePhotoArea).observe(nameTitle);
  window.addEventListener('resize', updatePhotoArea);
  document.fonts.ready.then(updatePhotoArea);
  updatePhotoArea();

  function alignLandscapeControls() {
    if (!album || gridOpen || !matchMedia('(orientation: landscape) and (max-height: 600px) and (max-width: 1100px)').matches) return;
    const stage = document.querySelector('.photo-stage').getBoundingClientRect();
    const [width, height] = album.sizes[0];
    const displayedHeight = Math.min(stage.height, stage.width * height / width);
    document.documentElement.style.setProperty('--landscape-photo-bottom', `${stage.top + (stage.height + displayedHeight) / 2}px`);
  }
  new ResizeObserver(alignLandscapeControls).observe(document.querySelector('.photo-stage'));
  window.addEventListener('resize', alignLandscapeControls);
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
    else requestAnimationFrame(alignLandscapeControls);
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
    requestAnimationFrame(alignLandscapeControls);
  }
  const desktopPhotoNavigation = matchMedia('(min-width: 601px) and (hover: hover) and (pointer: fine)');
  function photoZone(clientX, bounds) {
    const fraction = (clientX - bounds.left) / bounds.width;
    return fraction < 1 / 3 ? 'previous' : fraction < 2 / 3 ? 'gallery' : 'next';
  }
  function updatePhotoCursor(event) {
    if (!desktopPhotoNavigation.matches || event.pointerType !== 'mouse') {
      delete photo.dataset.direction;
      return;
    }
    const bounds = photo.getBoundingClientRect();
    photo.dataset.direction = photoZone(event.clientX, bounds);
  }
  photo.addEventListener('pointerenter', updatePhotoCursor);
  photo.addEventListener('pointermove', updatePhotoCursor);
  photo.addEventListener('pointerleave', () => { delete photo.dataset.direction; });
  photo.addEventListener('click', event => {
    if (gridOpen || !desktopPhotoNavigation.matches || (event.pointerType && event.pointerType !== 'mouse')) return;
    const bounds = photo.getBoundingClientRect();
    const zone = photoZone(event.clientX, bounds);
    if (zone === 'gallery') {
      delete photo.dataset.direction;
      setGrid(true);
      grid.querySelector('button')?.focus({preventScroll: true});
      return;
    }
    const step = zone === 'previous' ? -1 : 1;
    index = (index + step + album.photos.length) % album.photos.length;
    showPhoto();
  });
  photo.draggable = false;
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
