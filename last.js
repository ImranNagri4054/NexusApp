function publicSelect(card) {
    document.querySelectorAll('.public-card')
        .forEach(item => item.classList.remove('public-active'));

    card.classList.add('public-active');
}
