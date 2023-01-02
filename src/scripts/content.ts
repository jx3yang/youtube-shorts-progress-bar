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

/**
 * Creates a progress bar and appends it to the given element
 * 
 * TODO: actually implement this
 * 
 * @param parent the parent element to append the progress bar
 * @returns the progress bar element
 */
const createProgressBarAndAppend = (parent: Element) => {
  let div = document.createElement('div')
  div.setAttribute('style', 'background-color: red; width: 100px; height: 100px;')
  parent.appendChild(div)
  return div
}

const bootstrap = () => {
  let shortsElements: Element[] = []

  let activeElement: Element
  let activeProgressBar: Element

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
      activeProgressBar = createProgressBarAndAppend(activeElement)
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

bootstrap()
