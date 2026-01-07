document.addEventListener('DOMContentLoaded', function () {
  var data = window.showroomShowcaseData;
  if (!data) return;

  var section = document.getElementById('section-' + data.sectionId);
  if (!section) return;

  var mainImages = section.querySelectorAll('.ss-main-image');
  var thumbnails = section.querySelectorAll('.ss-thumbnail');
  var thumbnailsContainer = section.querySelector('.ss-thumbnails');
  var paginationContainer = section.querySelector('.ss-pagination');

  var currentIndex = 0;
  var currentPage = 0;
  var thumbnailsPerPage = data.thumbnailsPerPage || 4;
  var totalPages = Math.ceil(data.imageCount / thumbnailsPerPage);

  // Switch to specific image
  function showImage(index) {
    if (index < 0 || index >= data.imageCount) return;

    // Update main images
    mainImages.forEach(function (img) {
      img.classList.remove('active');
    });
    if (mainImages[index]) {
      mainImages[index].classList.add('active');
    }

    // Update thumbnails
    thumbnails.forEach(function (thumb) {
      thumb.classList.remove('active');
    });
    if (thumbnails[index]) {
      thumbnails[index].classList.add('active');
    }

    currentIndex = index;

    // Update pagination dots
    updatePaginationDots();

    // Auto-scroll to page containing this thumbnail
    var targetPage = Math.floor(index / thumbnailsPerPage);
    if (targetPage !== currentPage) {
      goToPage(targetPage);
    }
  }

  // Thumbnail click handlers
  thumbnails.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var index = parseInt(this.getAttribute('data-index'), 10);
      showImage(index);
    });
  });

  // Pagination
  function goToPage(page) {
    if (page < 0 || page >= totalPages) return;
    currentPage = page;

    // Slide thumbnails
    var offset = -(page * 100);
    thumbnailsContainer.style.transform = 'translateX(' + offset + '%)';

    // Update pagination dots
    updatePaginationDots();
  }

  function createPaginationDots() {
    if (!paginationContainer || data.imageCount <= 1) return;

    paginationContainer.innerHTML = '';
    for (var i = 0; i < data.imageCount; i++) {
      var dot = document.createElement('button');
      dot.className = 'ss-pagination-dot';
      dot.setAttribute('data-index', i);
      dot.setAttribute('aria-label', 'View image ' + (i + 1));
      if (i === 0) dot.classList.add('active');

      dot.addEventListener('click', function () {
        var index = parseInt(this.getAttribute('data-index'), 10);
        showImage(index);
      });

      paginationContainer.appendChild(dot);
    }
  }

  function updatePaginationDots() {
    if (!paginationContainer) return;
    var dots = paginationContainer.querySelectorAll('.ss-pagination-dot');
    dots.forEach(function (dot, index) {
      if (index === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // Initialize
  createPaginationDots();

  // Show first image by default
  showImage(0);
});
