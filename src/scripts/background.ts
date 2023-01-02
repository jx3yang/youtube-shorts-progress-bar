type Message = {
  id: number
}

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  const { tabId, url } = details
  if (/^https\:\/\/www\.youtube\.com\/*/.test(url)) {
    const message: Message = {
      id: tabId
    }
    chrome.tabs.sendMessage(tabId, message)
  }
})
