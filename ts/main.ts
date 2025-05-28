interface ComicSet {
  setLabel: string; // Image file names prefix
  numBoxes: number; // Num boxes (images) to scroll thru
  boxWHRatios: number[]; // Defines width/height ratio (& zoom scale level) for each box
}

const comicSets: ComicSet[] = [
  {
    setLabel: 'a',
    numBoxes: 10,
    boxWHRatios: [1, 1, 1 / 3, 1, 2, 1, 1, 1 / 3, 1, 1],
  },
  {
    setLabel: 'b',
    numBoxes: 10,
    boxWHRatios: [1, 4, 10 / 35, 1, 1, 1, 1, 1, 1, 1],
  },
  { setLabel: 'c', numBoxes: 7, boxWHRatios: [2 / 3, 1, 1, 1, 1, 1, 1] },
];

const widthToHeightRatioZoomScale = (whRatio: number): number =>
  Math.round((whRatio >= 1 ? whRatio : 1 / whRatio) * 1000) / 1000;

const numAudioSets = 2; // Number of background audio files
const numFadeSteps = 25; // Fade animation step count
const numSwipeThruSteps = 100; // Swipe thru box Animation step count
const scaleMax = 1.025; // Bit of over-scaling for fade in effect
const opacityMax = 1;
const opacityMin = 0;
const boxFadeDelay = 350; // Fade animation duration
const boxSwipeThruDelay = 50; // Fade animation duration
const singleClickDelay = 250; // adjust delay to match typical double-click speed:
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

const numComicSets = comicSets.length;
const randomComic = comicSets[Math.floor(Math.random() * numComicSets)];

const numBoxes = randomComic.numBoxes;
const imagesetLabel = randomComic.setLabel;
const boxWHRatios = randomComic.boxWHRatios;
const audiosetLabel = 1 + Math.floor(Math.random() * numAudioSets);

let currIndex = 0;
let $boxImage: HTMLElement | null = null;
let singleClickTimeout: NodeJS.Timeout | null = null;
let fadeStepTimeout: NodeJS.Timeout | null = null;
let swipeThruStepTimeout: NodeJS.Timeout | null = null;
let opacity = opacityMin;
let scale = widthToHeightRatioZoomScale(boxWHRatios[currIndex]) * scaleMax;
let translate = 0;
let fadeAnimationBusy = false;
let firstClick = true;

function showIndex(targetIndex: number): void {
  console.log(targetIndex);
  currIndex = targetIndex;
  /*
  $boxImage?.classList.add('faded-out');
  setTimeout(() => {
    $boxImage!.setAttribute('src', `images/${imagesetLabel}${currIndex}.png`);
    $boxImage?.classList.remove('faded-out');
  }, boxFadeDelay);
  */
  performFadeOutThenIn();
}

function performFadeOutThenIn(): void {
  const whRatio = boxWHRatios[currIndex];
  const zoomScale = widthToHeightRatioZoomScale(whRatio);
  performFadeInOut(
    opacityMax,
    opacityMin,
    zoomScale,
    zoomScale * scaleMax,
    whRatio === 1
      ? 0
      : (whRatio > 1 ? windowWidth : windowHeight) / zoomScale / 4,
    0,
    true,
    false,
  );
}

function performFadeIn(firstTime: boolean): void {
  const whRatio = boxWHRatios[currIndex];
  const zoomScale = widthToHeightRatioZoomScale(whRatio);
  performFadeInOut(
    opacityMin,
    opacityMax,
    zoomScale * scaleMax,
    zoomScale,
    0,
    whRatio === 1
      ? 0
      : (whRatio > 1 ? windowWidth : windowHeight) / zoomScale / 4,
    false,
    firstTime,
  );
}

function performFadeInOut(
  opacityStart: number,
  opacityEnd: number,
  scaleStart: number,
  scaleEnd: number,
  translateStart: number,
  translateEnd: number,
  isFadeOutThenIn: boolean,
  firstTime: boolean,
): void {
  fadeStepTimeout = setInterval(() => {
    opacity +=
      Math.round(((opacityEnd - opacityStart) / numFadeSteps) * 100) / 100;
    scale += Math.round(((scaleEnd - scaleStart) / numFadeSteps) * 1000) / 1000;
    translate +=
      Math.round(((translateEnd - translateStart) / numFadeSteps) * 10) / 10;
    $boxImage!.style.opacity = String(opacity);
    $boxImage!.style.transform = `scale(${scale}) translateY(${translate}px)`;
    if (Math.abs(opacity - opacityEnd) < 0.01) {
      if (fadeStepTimeout) {
        clearInterval(fadeStepTimeout);
        fadeStepTimeout = null;
      }
      $boxImage!.style.opacity = String(opacityEnd);
      $boxImage!.style.transform = `scale(${scaleEnd}) translateY(${translateEnd}px)`;
      scale = scaleEnd;
      translate = translateEnd;
      if (isFadeOutThenIn) {
        $boxImage!.setAttribute(
          'src',
          `images/${imagesetLabel}${currIndex + 1}.png`,
        );
        setTimeout(() => performFadeIn(false), boxFadeDelay);
        return;
      } else {
        if (firstTime) $boxImage?.classList.remove('faded-out');
        if (boxWHRatios[currIndex] !== 1) {
          performBoxSwipeThru(translateEnd, -translateEnd);
          return;
        }
      }
      fadeAnimationBusy = false;
    }
  }, boxFadeDelay / numFadeSteps);
}

function performBoxSwipeThru(
  translateStart: number,
  translateEnd: number,
): void {
  swipeThruStepTimeout = setInterval(() => {
    translate += Math.round(
      (translateEnd - translateStart) / numSwipeThruSteps,
    );
    $boxImage!.style.transform = `scale(${scale}) translateY(${translate}px)`;
    if (Math.abs(translate - translateEnd) < 10) {
      if (swipeThruStepTimeout) {
        clearInterval(swipeThruStepTimeout);
        fadeStepTimeout = null;
      }
      $boxImage!.style.transform = `scale(${scale}) translateY(${translateEnd}px)`;
      translate = translateEnd;
      fadeAnimationBusy = false;
    }
  }, boxSwipeThruDelay);
}

const getNextIndex = (): number =>
  currIndex === numBoxes - 1 ? 0 : currIndex + 1;
const getPrevIndex = (): number =>
  currIndex === 0 ? numBoxes - 1 : currIndex - 1;

function handleClick(): void {
  // Delay the click handler slightly to ignore if it's a double-click:
  // If there's already a timer, let it continue:
  if (fadeAnimationBusy || singleClickTimeout) return;
  // Cancel any box swipe thru that might be happening:
  if (swipeThruStepTimeout) clearInterval(swipeThruStepTimeout);
  // Select bg audio randomly and play:
  if (firstClick) {
    firstClick = false;
    const $bgAudio = document.querySelector('#bg-audio') as HTMLAudioElement;
    if ($bgAudio) {
      $bgAudio.setAttribute('src', `audio/${audiosetLabel}.mp3`);
      $bgAudio.loop = true;
      $bgAudio.play();
    }
  }
  singleClickTimeout = setTimeout(() => {
    fadeAnimationBusy = true;
    showIndex(getNextIndex());
    singleClickTimeout = null;
  }, singleClickDelay);
}

function handleDblClick(): void {
  if (fadeAnimationBusy) return;
  fadeAnimationBusy = true;
  singleClickTimeout && clearTimeout(singleClickTimeout); // Prevent single click from firing
  showIndex(getPrevIndex());
  singleClickTimeout = null;
}

function handleOnLoad(): void {
  // Create img element for comic:
  $boxImage = document.createElement('img');
  $boxImage.className = 'box faded-out';
  $boxImage.setAttribute('alt', 'box');
  $boxImage.setAttribute('src', `images/${imagesetLabel}${currIndex + 1}.png`);
  $boxImage!.setAttribute('draggable', 'false');
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
