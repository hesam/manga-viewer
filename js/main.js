'use strict';
const numImages = 10; // Num images to scroll thru
const numFadeSteps = 25; // Fade Animation step count
const opacityMax = 1;
const opacityMin = 0;
const scaleMax = 1.025;
const scaleMin = 1;
const boxFadeDelay = 350; // Fade animation duration
const singleClickDelay = 250; // adjust delay to match typical double-click speed:
const imagesetLabel = Math.random() > 0.5 ? 'a' : 'b';
let currIndex = 1;
let $boxImage = null;
let singleClickTimeout = null;
let fadeStepTimeout = null;
let currFadeStep = 0;
let opacity = opacityMin;
let scale = scaleMax;
function showIndex(targetIndex) {
  console.log(targetIndex);
  currIndex = targetIndex;
  /*
    $boxImage?.classList.add('faded-out');
    setTimeout(() => {
      $boxImage!.setAttribute('src', `images/${imagesetLabel}${currIndex}.png`);
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
        $boxImage.setAttribute(
          'src',
          `images/${imagesetLabel}${currIndex}.png`,
        );
        setTimeout(() => performFadeIn(false), boxFadeDelay / 3);
      } else if (firstTime) $boxImage?.classList.remove('faded-out');
    }
  }, boxFadeDelay / numFadeSteps);
}
const getNextIndex = () => (currIndex === numImages ? 1 : currIndex + 1);
const getPrevIndex = () => (currIndex === 1 ? numImages : currIndex - 1);
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
  // Create img element for comic:
  $boxImage = document.createElement('img');
  $boxImage.className = 'box faded-out';
  $boxImage.setAttribute('alt', 'box');
  $boxImage.setAttribute('src', `images/${imagesetLabel}${currIndex}.png`);
  $page?.appendChild($boxImage);
  // Fade image in:
  performFadeIn(true);
}
const $page = document.querySelector('.page');
if (!$page) throw new Error('$page is null');
// On dbl-click move to prev image:
$page.addEventListener('dblclick', handleDblClick);
// On click move to next image:
$page.addEventListener('click', handleClick);
// Fade first image in:
document.addEventListener('DOMContentLoaded', handleOnLoad);
