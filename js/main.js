'use strict';
const numImages = 10;
const boxFadeDelay = 350;
// Adjust delay to match typical double-click speed:
const singleClickDelay = 250;
const $boxImage = document.querySelector('.box');
if (!$boxImage) throw new Error('Image not found!');
let currIndex = 1;
let singleClickTimeout = null;
let fadeStepTimeout = null;
const numFadeSteps = 25;
let currFadeStep = 0;
const opacityMax = 1;
const opacityMin = 0;
let opacity = opacityMax;
const scaleMax = 1.05;
const scaleMin = 1;
let scale = 1;
function showIndex(targetIndex) {
  console.log(targetIndex);
  currIndex = targetIndex;
  /*
    $boxImage?.classList.add('faded-out');
    setTimeout(() => {
      $boxImage!.setAttribute('src', `images/${currIndex}.png`);
      $boxImage?.classList.remove('faded-out');
    }, boxFadeDelay);
    */
  performFadeOut();
}
function performFadeOut() {
  performFadeInOut(opacityMax, opacityMin, scaleMin, scaleMax, true, false);
}
function performFadeIn(firstTime) {
  performFadeInOut(
    opacityMin,
    opacityMax,
    scaleMax,
    scaleMin,
    false,
    firstTime,
  );
}
function performFadeInOut(
  opacityStart,
  opacityEnd,
  scaleStart,
  scaleEnd,
  isFadeOut,
  firstTime,
) {
  fadeStepTimeout = setInterval(() => {
    currFadeStep += 1;
    opacity +=
      Math.round(((opacityEnd - opacityStart) / numFadeSteps) * 100) / 100;
    scale += Math.round(((scaleEnd - scaleStart) / numFadeSteps) * 1000) / 1000;
    $boxImage.style.opacity = String(opacity);
    $boxImage.style.transform = `scale(${scale})`;
    if (currFadeStep === numFadeSteps && fadeStepTimeout) {
      clearInterval(fadeStepTimeout);
      fadeStepTimeout = null;
      currFadeStep = 0;
      $boxImage.style.opacity = String(opacityEnd);
      $boxImage.style.transform = `scale(${scaleEnd})`;
      if (isFadeOut) {
        $boxImage.setAttribute('src', `images/${currIndex}.png`);
        setTimeout(() => performFadeIn(false), boxFadeDelay / 3);
      } else if (firstTime) {
        $boxImage?.classList.remove('faded-out');
      }
    }
  }, boxFadeDelay / numFadeSteps);
}
function getNextIndex() {
  if (currIndex === numImages) {
    return 1;
  } else {
    return currIndex + 1;
  }
}
function getPrevIndex() {
  if (currIndex === 1) {
    return numImages;
  } else {
    return currIndex - 1;
  }
}
function handleClick() {
  // Delay the click handler slightly to ignore if it's a double-click:
  // If there's already a timer, let it continue:
  if (singleClickTimeout) return;
  singleClickTimeout = setTimeout(() => {
    showIndex(getNextIndex());
    singleClickTimeout = null;
  }, singleClickDelay);
}
function handleDblClick() {
  singleClickTimeout && clearTimeout(singleClickTimeout); // Prevent single click from firing
  showIndex(getPrevIndex());
  singleClickTimeout = null;
}
function handleOnLoad() {
  // showIndex(currIndex);
  performFadeIn(true);
}
const $page = document.querySelector('.page');
if (!$page) throw new Error('$page is null');
$page.addEventListener('dblclick', handleDblClick);
$page.addEventListener('click', handleClick);
document.addEventListener('DOMContentLoaded', handleOnLoad);
