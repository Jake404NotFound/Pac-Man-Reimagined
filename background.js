// Service worker for the Chrome extension
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: 'game.html' });
});
