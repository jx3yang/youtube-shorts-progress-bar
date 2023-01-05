interface Page {
  queryContainerElement: () => Element | null
  queryParentElements: () => Element[]
  getAppendParentFromParent: (parent: Element) => Element | null
  getVideoElementFromParent: (parent: Element) => HTMLVideoElement | null
  isVideoElementReady: (parent: Element) => boolean
  findCurrentActiveParentElement: (elements: Element[]) => Element | undefined
  refreshOnElementMutation: (mutation: MutationRecord) => boolean
  refreshOnContainerMutation: (mutation: MutationRecord) => boolean
  urlPatterns: () => RegExp[]
}

// container
//   |_____ parent (i.e. an ancestor node that contains exactly one video)
//   |         |
//   |        ...
//   |         |____ append-parent (i.e. the node that will be used to append the bar)
//   |                     |
//   |                    ...
//   |                     |____ video-element
//   |
//   |
//   |_____ parent
//   |        |
//  ...      ...
