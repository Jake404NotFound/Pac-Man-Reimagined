document.addEventListener('DOMContentLoaded', function() {
    const playButton = document.getElementById('playButton');
    
    playButton.addEventListener('click', function() {
        chrome.tabs.create({ url: 'game.html' });
    });
});
