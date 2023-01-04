const containerStyle = `
  width: 100%;
  position: inherit;
  display: flex;
  justify-content: center;
`

const progressBarContainerStyle = `
  width: 80%;
  position: absolute;
  height: 10px;
  position: absolute;
  pointer-events: all;
  z-index: 10;
  bottom: 15%;
  cursor: pointer;
`

const progressBarStyle = `
  position: absolute;
  background-color: rgba(255,255,255,.5);
  opacity: 50%;
  width: 100%;
  z-index: 10;
  bottom: 15%;
  height: 3px;
`

const progressedStyle = (width: string) => `
  z-index: 20;
  height: 100%;
  width: ${width};
  background-color: rgba(255,255,255,1);
`

/**
 * @returns the list of shorts
 */
const querySelectShortsElements = () => [...document.querySelectorAll(".reel-video-in-sequence")]

/**
 * @returns the container of the shorts
 */
const querySelectShortsContainer = () => document.querySelector("#shorts-inner-container")

function waitUntil<T>(loader: () => T | null | undefined, condition: (t: T) => boolean, intervalMs: number = 500): Promise<T> {
  return new Promise<T>((resolve) => {
    const element = loader()
    if (element && condition(element)) {
      resolve(element)
    }
    const intervalId = setInterval(() => {
      const element = loader()
      if (element && condition(element)) {
        clearInterval(intervalId)
        resolve(element)
      }
    }, intervalMs)
  })
}

const getShortsElements = () => waitUntil<Element[]>(querySelectShortsElements, (elements) => elements.length > 0)

const getShortsContainer = () => waitUntil<Element>(querySelectShortsContainer, (element) => !!element)

/**
 * 
 * @param shorts the list of currently rendered shorts elements on the page
 * @returns the active element
 */
const findCurrentActiveElement = (shorts: Element[]) => {
  return shorts.find((short) => !!(short.attributes as any)['is-active'])
}

const areDifferentElements = (currentElements: Element[], newElements: Element[]) => {
  if (currentElements.length !== newElements.length) {
    return true
  }
  return currentElements.findIndex((element, index) => element !== newElements[index]) > 0
}

const createDivWithStyle = (style: string) => {
  let div = document.createElement('div')
  div.setAttribute('style', style)
  return div
}

/**
 * Creates the progress bar container element with the corresponding event listeners
 * 
 * @param videoElement the short video element
 * @returns the progress bar container element
 */
const createProgressBarContainer = (videoElement: HTMLVideoElement) => {
  let progressBarContainer = createDivWithStyle(progressBarContainerStyle)
  let progressBar = createDivWithStyle(progressBarStyle)
  let progressed = createDivWithStyle(progressedStyle('0%'))
  progressBar.appendChild(progressed)
  progressBarContainer.appendChild(progressBar)

  const clipNumber = (n: number, left: number, right: number) => {
    if (left <= n && n <= right) {
      return n
    }
    if (left <= n) {
      return right
    }
    return left
  }

  const updateVideoProgress = (clientX: number) => {
    const { x: containerX } = progressBarContainer.getBoundingClientRect()
    const { offsetWidth } = progressBarContainer
    const offsetX = clipNumber(clientX - containerX, 0, offsetWidth)

    const percentComplete = (offsetX * 100) / offsetWidth
    progressed.setAttribute('style', progressedStyle(`${percentComplete}%`))
    videoElement.currentTime = (offsetX * videoElement.duration) / offsetWidth
  }

  videoElement.addEventListener('timeupdate', () => {
    if (!isNaN(videoElement.duration)) {
      const percentComplete = (videoElement.currentTime * 100) / videoElement.duration
      progressed.setAttribute('style', progressedStyle(`${percentComplete}%`))
    }
  })

  // dragging logic starts here
  let isPressedDown = false

  progressBarContainer.addEventListener('mousedown', (e) => {
    // 0 is left click
    if (e.button === 0) {
      e.preventDefault()
      isPressedDown = true
    }
  })

  document.addEventListener('mousemove', (e) => {
    if (isPressedDown) {
      e.preventDefault()
      const { clientX } = e
      updateVideoProgress(clientX)
    }
  })

  document.addEventListener('mouseup', (e) => {
    if (isPressedDown && e.button === 0) {
      e.preventDefault()
      isPressedDown = false
      const { clientX } = e
      updateVideoProgress(clientX)
    }
  })

  return progressBarContainer
}

/**
 * Creates a progress bar for the video inside the parent element, and appends it to the overlay inside the parent
 * 
 * @param parent the parent element that contains the video element
 * @returns the progress bar element
 */
const createProgressBarAndAppend = (parent?: Element | null) => {
  if (parent) { 
    const overlay = parent.querySelector('#overlay')
    const videoElement = parent.querySelector('video')

    if (videoElement && overlay) {
      const containerDivId = "youtube-shorts-progress-bar-container-id"
      const existingContainerDiv = overlay.querySelector(`#${containerDivId}`)
      if (existingContainerDiv) {
        return existingContainerDiv
      }

      let containerDiv = createDivWithStyle(containerStyle)
      containerDiv.id = containerDivId
      let progressBarContainer = createProgressBarContainer(videoElement)

      containerDiv.appendChild(progressBarContainer)
      overlay.appendChild(containerDiv)

      return containerDiv
    }
  }
}

const getVideoParentElement = (rendererElement: Element) => waitUntil<Element>(() => rendererElement, (element) => !!element.querySelector('.html5-video-container') && !!element.querySelector('#overlay'), 50)

const bootstrap = () => {
  let shortsElements: Element[] = []

  let activeElement: Element
  let activeProgressBar: Element | undefined

  // this observes each short element to listen for changes in the 'is-active' attribute
  const elementsObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // so the refresh is going to be dispatched twice
      //   1. when the currently active becomes inactive, a mutation is observed
      //   2. when a new element becomes active, another mutation is observed
      // but calling refresh multiple times is no big deal, and it's simpler this way
      if (mutation.type === 'attributes' && mutation.attributeName === 'is-active') {
        refreshActiveElement()
      }
    })
  })

  // this observes for the shorts container element to listen for new rendered elements
  const containerObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        refreshShortsElements()
      }
    })
  })

  const getActiveElement = (elements: Element[]) => waitUntil<Element>(() => findCurrentActiveElement(elements), (element) => !!element, 500)

  const setActiveElement = (element?: Element) => {
    if (element && activeElement !== element) {
      activeElement = element
      if (activeProgressBar) {
        activeProgressBar.remove()
      }
      getVideoParentElement(activeElement).then((videoParent) => {
        activeProgressBar = createProgressBarAndAppend(videoParent)
      })
    }
  }

  const refreshActiveElement = () => {
    getActiveElement(shortsElements).then(setActiveElement)
  }

  const setShortsElements = (newElements: Element[]) => {
    if (areDifferentElements(shortsElements, newElements)) {
      shortsElements = newElements
      // the most correct way would be to take the difference between the current elements and the new elements
      // and only setup the observer on those, but this does the job and is simpler
      shortsElements.forEach((element) => {
        elementsObserver.observe(element, {
          attributes: true
        })
      })
      refreshActiveElement()
    }
  }

  const refreshShortsElements = () => {
    getShortsElements().then(setShortsElements)
  }

  // when the container is ready, setup the observer on it
  getShortsContainer().then((shortsContainer) => {
    containerObserver.observe(shortsContainer, {
      childList: true
    })
  })

  // triggers the polling of the shorts elements
  refreshShortsElements()
}

const bootstrapIfOnShortsPage = () => {
  const shortsUrlPattern = /^https\:\/\/www\.youtube\.com\/shorts*/
  const currentUrl = window.location.href
  if (shortsUrlPattern.test(currentUrl)) {
    bootstrap()
  }
}

bootstrapIfOnShortsPage()

chrome.runtime.onMessage.addListener((request: Message) => {
  bootstrapIfOnShortsPage()
})
