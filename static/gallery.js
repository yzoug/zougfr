window.addEventListener('load', function(){
  document.querySelector('footer').style = 'display: none';
  new Glider(document.querySelector('.glider'), {
      slidesToShow: 1,
      slidesToScroll: 1,
      scrollLock: true,
      draggable: true,
      dots: '.dots',
      arrows: {
        prev: '.glider-prev',
        next: '.glider-next'
      },
    }
  )
});
