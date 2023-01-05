import { youtubeShorts } from "./youtube-shorts"

const allPages = [youtubeShorts]

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
 * @param page the page interface
 * @param parent the parent element that contains the video element
 * @returns the progress bar element
 */
const createProgressBarAndAppendForPage = (page: Page, parent?: Element | null) => {
  if (parent) { 
    const appendParent = page.getAppendParentFromParent(parent)
    const videoElement = page.getVideoElementFromParent(parent)

    if (videoElement && appendParent) {
      const containerDivId = "youtube-shorts-progress-bar-container-id"
      const existingContainerDiv = appendParent.querySelector(`#${containerDivId}`)
      if (existingContainerDiv) {
        return existingContainerDiv
      }

      let containerDiv = createDivWithStyle(containerStyle)
      containerDiv.id = containerDivId
      let progressBarContainer = createProgressBarContainer(videoElement)

      containerDiv.appendChild(progressBarContainer)
      appendParent.appendChild(containerDiv)

      return containerDiv
    }
  }
}

/**
 * Starting point.
 * 
 * @param page the page interface
 */
const bootstrapPage = (page: Page) => {
  let allParentElements: Element[] = []

  let activeParentElement: Element
  let activeProgressBar: Element | undefined

  const elementsObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (page.refreshOnElementMutation(mutation)) {
        refreshActiveElement()
      }
    })
  })

  // this observes for the shorts container element to listen for new rendered elements
  const containerObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (page.refreshOnContainerMutation(mutation)) {
        refreshParentElements()
      }
    })
  })

  const refreshActiveElement = () => {
    getActiveParentElement(allParentElements).then(setActiveParentElement)
  }

  const getParentElements = () =>
    waitUntil<Element[]>(page.queryParentElements, (elements) => elements && elements.length > 0)
  const getContainerElement = () =>
    waitUntil<Element>(page.queryContainerElement, (element) => !!element)

  const getActiveParentElement = (elements: Element[]) =>
    waitUntil<Element>(() => page.findCurrentActiveParentElement(elements), (element) => !!element, 500)

  const waitUntilVideoIsReady = (element: Element) =>
    waitUntil<boolean>(() => page.isVideoElementReady(element), (ready) => ready, 50)

  const setActiveParentElement = (element?: Element) => {
    if (element && activeParentElement !== element) {
      activeParentElement = element
      if (activeProgressBar) {
        activeProgressBar.remove()
      }
      waitUntilVideoIsReady(activeParentElement).then(() => {
        activeProgressBar = createProgressBarAndAppendForPage(page, activeParentElement)
      })
    }
  }

  const setParentElements = (newElements: Element[]) => {
    if (areDifferentElements(allParentElements, newElements)) {
      allParentElements = newElements
      // the most correct way would be to take the difference between the current elements and the new elements
      // and only setup the observer on those, but this does the job and is simpler
      allParentElements.forEach((element) => {
        elementsObserver.observe(element, {
          attributes: true
        })
      })
      refreshActiveElement()
    }
  }

  const refreshParentElements = () => {
    getParentElements().then(setParentElements)
  }

  // when the container is ready, setup the observer on it
  getContainerElement().then((container) => {
    containerObserver.observe(container, {
      childList: true
    })
  })

  // triggers the polling of the elements
  refreshParentElements()
}

const bootstrapIfOnPage = (page: Page) => {
  const urlPatterns = page.urlPatterns()
  const currentUrl = window.location.href
  if (urlPatterns.findIndex((pattern) => pattern.test(currentUrl)) >= 0) {
    bootstrapPage(page)
  }
}

const mainBootstrap = () => {
  allPages.forEach(bootstrapIfOnPage)
}

mainBootstrap()

chrome.runtime.onMessage.addListener((request: Message) => {
  mainBootstrap()
})
