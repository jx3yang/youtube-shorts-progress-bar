# YouTube Shorts Progress Bar

## Description
I will not admit that I am addicted to YouTube shorts, but I will say that I do find myself watching those from time to time. One frustrating aspect of those is that they do not have an interactive progress bar which I can use to rewind a few seconds. Yes, I am aware that this is an intended behavior, but it doesn't mean that it's not annoying.

Luckily, nowadays we can solve annoying things with a bit of coding. If there is no progress bar, then I'll just add one myself. This repository contains the code for a Chrome Extension that adds a simple interactive progress bar to the YouTube shorts.

## Installation
Download the zip file of the [latest release](https://github.com/jx3yang/youtube-shorts-progress-bar/releases/tag/v1.0.0) named `youtube-shorts-progress-bar.zip`. Unzip the file, it should contain a folder named `dist/`. Open Chrome, and navigate to `chrome://extensions`. On top right, make sure that `Developer mode` is turned on. Then, click on `Load unpacked` on the top left, and select the `dist/` folder. The extension is now loaded.

## Build
If you want to build the extension from source, you can do so by cloning the repository and running
```
yarn && yarn build
```
This will give you a `dist/` folder which you can load using the same steps outlined in the installation section.

## Demo
![Demo](./static/demo.gif)

Short in Demo: https://www.youtube.com/shorts/96GnOB1iZQI
