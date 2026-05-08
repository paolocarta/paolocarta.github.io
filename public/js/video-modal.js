(function () {
  var modal = document.getElementById('videoModal');
  if (!modal) return;

  var frame = document.getElementById('videoModalFrame');
  var backdrop = modal.querySelector('.video-modal-backdrop');
  var closeBtn = modal.querySelector('.video-modal-close');

  function openModal(videoId) {
    frame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    frame.src = '';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.talk-card[data-video-id]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      openModal(card.dataset.videoId);
    });
  });

  backdrop.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();
