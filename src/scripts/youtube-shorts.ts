const querySelectShortElements = () => [...document.querySelectorAll(".reel-video-in-sequence")]
const querySelectShortsContainer = () => document.querySelector("#shorts-inner-container")

const findCurrentActiveShort = (shorts: Element[]) => {
  return shorts.find((short) => !!(short.attributes as any)['is-active'])
}

const isShortVideoReady = (parent: Element) =>
  !!parent.querySelector('.html5-video-container') && !!parent.querySelector('#overlay')

const getVideoElementFromShortsElement = (element: Element) => element.querySelector('video')

const getOverlayFromShortElement = (element: Element) => element.querySelector('#overlay')

// so the refresh is going to be dispatched twice
//   1. when the currently active becomes inactive, a mutation is observed
//   2. when a new element becomes active, another mutation is observed
// but calling refresh multiple times is no big deal, and it's simpler this way
const refreshOnShortElementMutation = (mutation: MutationRecord) => mutation.type === 'attributes' && mutation.attributeName === 'is-active'

// refresh when the child list is updated
const refreshOnShortsContainerMutation = (mutation: MutationRecord) => mutation.type === 'childList'

const youtubeShorts: Page = {
  queryParentElements: querySelectShortElements,
  queryContainerElement: querySelectShortsContainer,
  getVideoElementFromParent: getVideoElementFromShortsElement,
  getAppendParentFromParent: getOverlayFromShortElement,
  isVideoElementReady: isShortVideoReady,
  findCurrentActiveParentElement: findCurrentActiveShort,
  refreshOnElementMutation: refreshOnShortElementMutation,
  refreshOnContainerMutation: refreshOnShortsContainerMutation,
  urlPatterns: () => [/^https\:\/\/www\.youtube\.com\/shorts*/],
}

export { youtubeShorts }
