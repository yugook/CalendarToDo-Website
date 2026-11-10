(() => {
  /** @param {Event & { viewTransition?: ViewTransition | null }} event */
  const handleTransition = (event) => {
    // Skipping a cross-document animation rejects ready; navigation still works.
    // Handle that optional animation's promise, without filtering page errors.
    event.viewTransition?.ready.catch(() => {});
  };

  window.addEventListener('pageswap', handleTransition);
  window.addEventListener('pagereveal', handleTransition);
})();
