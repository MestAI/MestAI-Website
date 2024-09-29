setInterval(() => {
    const loadText = document.getElementById('load-text');

    if (loadText === null) {
        return;
    }

    if (loadText.textContent === 'Loading') {
        loadText.textContent = 'Loading.';
    } else if (loadText.textContent === 'Loading.') {
        loadText.textContent = 'Loading..';
    } else if (loadText.textContent === 'Loading..') {
        loadText.textContent = 'Loading...';
    } else if (loadText.textContent === 'Loading...') {
        loadText.textContent = 'Loading';
    }
}, 1000);