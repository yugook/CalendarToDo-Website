const storageKey = 'calendar-todo:language-position';

interface SavedPosition {
  path: string;
  sectionId: string;
  progress: number;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const getSections = () =>
  Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));

const getHeaderHeight = () =>
  document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().height ?? 0;

const getCurrentSection = () => {
  const sections = getSections();
  const headerHeight = getHeaderHeight();
  const referencePosition =
    window.scrollY + headerHeight + Math.min((window.innerHeight - headerHeight) * 0.3, 160);

  return sections.reduce<HTMLElement | undefined>((current, section) => {
    return section.offsetTop <= referencePosition ? section : current;
  }, undefined);
};

const savePosition = (link: HTMLAnchorElement) => {
  const section = getCurrentSection();

  if (!section) {
    return;
  }

  const targetURL = new URL(link.href, window.location.href);
  const headerHeight = getHeaderHeight();
  const scrollableHeight = Math.max(
    section.offsetHeight - (window.innerHeight - headerHeight),
    0,
  );
  const offset = Math.max(window.scrollY + headerHeight - section.offsetTop, 0);
  const progress =
    scrollableHeight > 0 ? clamp(offset / scrollableHeight, 0, 1) : 0;

  targetURL.hash = section.id;

  const position = {
    path: targetURL.pathname,
    sectionId: section.id,
    progress,
  } satisfies SavedPosition;

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(position));
    // Do not queue a native fragment jump that could overwrite the saved progress.
    // The destination adds the fragment with replaceState after restoring once.
    targetURL.hash = '';
  } catch {
    // The hash still preserves the section when browser storage is unavailable.
  }
  link.href = targetURL.toString();
};

const restorePosition = () => {
  let position: SavedPosition | undefined;

  try {
    const savedValue = window.sessionStorage.getItem(storageKey);

    if (savedValue) {
      position = JSON.parse(savedValue) as SavedPosition;
      window.sessionStorage.removeItem(storageKey);
    }
  } catch {
    return;
  }

  if (!position || position.path !== window.location.pathname || !Number.isFinite(position.progress)) {
    return;
  }

  const section = document.getElementById(position.sectionId);

  if (!section) {
    return;
  }

  const controller = new AbortController();
  const stopRestoring = () => controller.abort();

  const restore = () => {
    if (controller.signal.aborted) return;
    stopRestoring();
    // Native scrollbar input may scroll without a DOM pointer or wheel event.
    if (Math.abs(window.scrollY) > 1) return;

    const headerHeight = getHeaderHeight();
    const scrollableHeight = Math.max(
      section.offsetHeight - (window.innerHeight - headerHeight),
      0,
    );
    const targetPosition = Math.max(
      section.offsetTop - headerHeight + scrollableHeight * clamp(position.progress, 0, 1),
      0,
    );

    if (Math.abs(window.scrollY - targetPosition) > 1) {
      window.scrollTo({ top: targetPosition, behavior: 'auto' });
    }
    const targetURL = new URL(window.location.href);
    targetURL.hash = section.id;
    window.history.replaceState(window.history.state, '', targetURL);
  };

  // Respect user input while loading, including scrolling via native UI.
  // All listeners are removed before the one-shot restoration.
  for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
    window.addEventListener(type, stopRestoring, {
      capture: true, passive: true, signal: controller.signal,
    });
  }
  window.addEventListener('scroll', () => {
    if (Math.abs(window.scrollY) > 1) stopRestoring();
  }, { passive: true, signal: controller.signal });
  window.addEventListener('pagehide', stopRestoring, { once: true, signal: controller.signal });

  if (document.readyState === 'complete') {
    restore();
  } else {
    window.addEventListener('load', restore, { once: true, signal: controller.signal });
  }
};

document
  .querySelectorAll<HTMLAnchorElement>('[data-language-switch-link]')
  .forEach((link) => {
    link.addEventListener('click', (event) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      savePosition(link);
    });
  });

restorePosition();
