const storageKey = 'calendar-todo:language-position';

interface SavedPosition {
  path: string;
  sectionId: string;
  progress: number;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const getSections = () =>
  Array.from(document.querySelectorAll<HTMLElement>('main > section[id]'));

const getCurrentSection = () => {
  const sections = getSections();
  const referencePosition =
    window.scrollY + Math.min(window.innerHeight * 0.3, 160);

  return sections.reduce<HTMLElement | undefined>((current, section) => {
    return section.offsetTop <= referencePosition ? section : current;
  }, sections[0]);
};

const savePosition = (link: HTMLAnchorElement) => {
  const section = getCurrentSection();

  if (!section) {
    return;
  }

  const targetURL = new URL(link.href, window.location.href);
  const scrollableHeight = Math.max(
    section.offsetHeight - window.innerHeight,
    0,
  );
  const offset = Math.max(window.scrollY - section.offsetTop, 0);
  const progress =
    scrollableHeight > 0 ? clamp(offset / scrollableHeight, 0, 1) : 0;

  targetURL.hash = section.id;
  link.href = targetURL.toString();

  const position = {
    path: targetURL.pathname,
    sectionId: section.id,
    progress,
  } satisfies SavedPosition;

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(position));
  } catch {
    // The hash still preserves the section when browser storage is unavailable.
  }
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

  if (!position || position.path !== window.location.pathname) {
    return;
  }

  const section = document.getElementById(position.sectionId);

  if (!section) {
    return;
  }

  const restore = () => {
    const scrollableHeight = Math.max(
      section.offsetHeight - window.innerHeight,
      0,
    );
    const targetPosition =
      section.offsetTop + scrollableHeight * clamp(position.progress, 0, 1);

    window.scrollTo({ top: targetPosition, behavior: 'auto' });
  };

  if (document.readyState === 'complete') {
    window.requestAnimationFrame(restore);
  } else {
    window.addEventListener(
      'load',
      () => window.requestAnimationFrame(restore),
      { once: true },
    );
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
