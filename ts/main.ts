// A list of comic boxes (panels) that make up the comic:
interface ComicSet {
  setLabel: string; // Image file names prefix
  numBoxes: number; // Num boxes (images) to scroll thru
}

// A box (panel) in the comic:
interface Box {
  width: number; // Width of box plus border width
  height: number; // Height of box plus border width
  isHoriz: boolean; // Is box width >= height
  isWidthOversized: boolean; // Is box width > window width
  isHeightOversized: boolean; // Is box height > window height
  scaleDownBy: number; // If box oversized, scale to shrink it so its width or height (whichever smaller) fits into window
  translateStart: number; // For oversized boxes, amount to translate (scroll) box to the left/top to scroll to top of view
}

const comicSets: ComicSet[] = [
  {
    setLabel: 'a',
    numBoxes: 23,
  },
  {
    setLabel: 'b',
    numBoxes: 10,
  },
  { setLabel: 'c', numBoxes: 7 },
  {
    setLabel: 'd',
    numBoxes: 10,
  },
];

const audioOn = true; // Play background audio (after first click)
const boxSwipeThruOn = true; // Animate scrolling through a box when zoom scale > 1
const cancelAutoSwipeOnUserScroll = false; // On manual scroll, cancel any auto-scroll that might be happening
const numAudioSets = 2; // Number of background audio files
const boxBorderWidth = 10; // border width (px) around boxes
const numFadeSteps = 25; // Fade animation step count
const scaleMax = 1.025; // Bit of over-scaling for fade in effect
const opacityMax = 1;
const opacityMin = 0;
const boxFadeDelay = 350; // Fade animation duration
const boxSwipeThruSpeed = 1.5; // Swipe thru box Animation speed
const swipeThruDelay = 300; // Swipe thru start delay
const singleClickDelay = 250; // Adjust delay to match typical double-click speed

// const numComicSets = comicSets.length;
const randomComic = comicSets[0]; // Math.floor(Math.random() * numComicSets)];
const numBoxes = randomComic.numBoxes;
const imagesetLabel = randomComic.setLabel;
const audiosetLabel = 1 + Math.floor(Math.random() * numAudioSets);

let currIndex = 0;
let $boxImage: HTMLImageElement | null = null;
let singleClickTimeout: NodeJS.Timeout | null = null;
let fadeStepTimeout: NodeJS.Timeout | null = null;
let swipeThruToBeHalted = true;
let box: Box;
let opacity = opacityMin;
let scale = scaleMax;
let translateX = 0;
let translateY = 0;
let fadeAnimationBusy = false;
let firstClick = true;
let firstBoxLoaded = false;

function showIndex(targetIndex: number): void {
  console.log(targetIndex);
  currIndex = targetIndex;
  performFadeOutThenIn();
}

// Animate prev box fading out then next box into view:
function performFadeOutThenIn(): void {
  performFadeInOut(
    opacityMax,
    opacityMin,
    1 * box.scaleDownBy,
    scaleMax * box.scaleDownBy,
    box.translateStart,
    0,
    box.isHoriz,
    true,
    false,
  );
}

// Animate box fading in to view:
function performFadeIn(firstTime: boolean): void {
  performFadeInOut(
    opacityMin,
    opacityMax,
    scaleMax * box.scaleDownBy,
    1 * box.scaleDownBy,
    0,
    box.translateStart,
    box.isHoriz,
    false,
    firstTime,
  );
}

// Helper to animate box fade out/in:
function performFadeInOut(
  opacityStart: number,
  opacityEnd: number,
  scaleStart: number,
  scaleEnd: number,
  translateStart: number,
  translateEnd: number,
  translateIsHoriz: boolean,
  isFadeOutThenIn: boolean,
  firstTime: boolean,
): void {
  // if (isFadeOutThenIn) window.scrollTo({ left: 0, top: 0 });
  // console.log(translateStart, translateEnd);
  const translateIncr =
    Math.round(((translateEnd - translateStart) / numFadeSteps) * 10) / 10;
  fadeStepTimeout = setInterval(() => {
    opacity +=
      Math.round(((opacityEnd - opacityStart) / numFadeSteps) * 100) / 100;
    scale += Math.round(((scaleEnd - scaleStart) / numFadeSteps) * 1000) / 1000;

    if (translateIsHoriz) translateX += translateIncr;
    else translateY += translateIncr;
    $boxImage!.style.opacity = String(opacity);
    $boxImage!.style.transform = `scale(${scale}) translate${translateIsHoriz ? 'X' : 'Y'}(${translateIsHoriz ? translateX : translateY}px)`;
    if (Math.abs(opacity - opacityEnd) < 0.01) {
      if (fadeStepTimeout) {
        clearInterval(fadeStepTimeout);
        fadeStepTimeout = null;
      }
      $boxImage!.style.opacity = String(opacityEnd);
      $boxImage!.style.transform = `scale(${scaleEnd}) translate${translateIsHoriz ? 'X' : 'Y'}(${translateEnd}px)`;
      scale = scaleEnd;
      if (translateIsHoriz) translateX = translateEnd;
      else translateY = translateEnd;
      if (isFadeOutThenIn) {
        // Changing the src attribute will cause the image 'load' event to refire once the new image is loaded:
        $boxImage!.setAttribute(
          'src',
          `images/${imagesetLabel}${currIndex + 1}.png`,
        );
        return;
      } else {
        if (firstTime) $boxImage?.classList.remove('faded-out');
        if (box.isWidthOversized || box.isHeightOversized) {
          fadeAnimationBusy = false;
          if (boxSwipeThruOn) {
            setTimeout(
              () =>
                performBoxSwipeThru(
                  box.isHoriz ? box.width : box.height,
                  box.isHoriz,
                ),
              swipeThruDelay,
            );
          }
        }
      }
      fadeAnimationBusy = false;
    }
  }, boxFadeDelay / numFadeSteps);
}

// Animate scrolling through a box (when zoom scale > 1):
function performBoxSwipeThru(scrollEnd: number, scrollIsHoriz: boolean): void {
  // console.log('scrollEnd', scrollEnd);
  const targetScroll = scrollEnd; // document.body[scrollIsHoriz ? 'scrollWidth' : 'scrollHeight'];
  // console.log('targetScroll', targetScroll);
  let prevDistance = 0;
  swipeThruToBeHalted = false;
  function animationStep(): void {
    if (swipeThruToBeHalted) return;
    const scroll = scrollIsHoriz ? window.scrollX : window.scrollY;
    // console.log('scroll', scroll, 'target', targetScroll);
    const distance = targetScroll - scroll;
    const move = Math.min(boxSwipeThruSpeed, distance);
    // console.log('distance', distance, 'prevDistance', prevDistance);
    if (Math.abs(distance - prevDistance) >= 1) {
      if (scrollIsHoriz) window.scrollBy(move, 0);
      else window.scrollBy(0, move);
      prevDistance = distance;
      requestAnimationFrame(animationStep);
    }
  }
  animationStep();
}

const getNextIndex = (): number =>
  currIndex === numBoxes - 1 ? 0 : currIndex + 1;
const getPrevIndex = (): number =>
  currIndex === 0 ? numBoxes - 1 : currIndex - 1;

// On click move to next image:
function handleClick(): void {
  // Delay the click handler slightly to ignore if it's a double-click:
  // If there's already a timer, let it continue:
  if (fadeAnimationBusy || singleClickTimeout) return;
  // Cancel any box swipe thru that might be happening:
  swipeThruToBeHalted = true;
  // Select bg audio randomly and play:
  if (firstClick) {
    firstClick = false;
    if (audioOn) {
      const $bgAudio = document.querySelector('#bg-audio') as HTMLAudioElement;
      if ($bgAudio) {
        $bgAudio.setAttribute('src', `audio/${audiosetLabel}.mp3`);
        $bgAudio.loop = true;
        $bgAudio.play();
      }
    }
  }
  singleClickTimeout = setTimeout(() => {
    fadeAnimationBusy = true;
    showIndex(getNextIndex());
    singleClickTimeout = null;
  }, singleClickDelay);
}

// On dbl-click move to prev image:
function handleDblClick(): void {
  if (fadeAnimationBusy) return;
  fadeAnimationBusy = true;
  singleClickTimeout && clearTimeout(singleClickTimeout); // Prevent single click from firing
  showIndex(getPrevIndex());
  singleClickTimeout = null;
}

// Fade first image in:
function handleOnLoad(): void {
  window.scrollTo(0, 0);
  // Create img element for comic:
  $boxImage = document.createElement('img') as HTMLImageElement;
  $boxImage.className = 'box faded-out';
  $boxImage.setAttribute('alt', 'box');
  $boxImage.setAttribute('src', `images/${imagesetLabel}${currIndex + 1}.png`);
  $boxImage!.setAttribute('draggable', 'false');
  $boxImage!.addEventListener('load', () => {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const w = $boxImage!.width + 2 * boxBorderWidth;
    const h = $boxImage!.height + 2 * boxBorderWidth;
    box = {
      width: w,
      height: h,
      isHoriz: w >= h,
      isWidthOversized: w > windowW,
      isHeightOversized: h > windowH,
      scaleDownBy:
        w > windowW && h > windowH
          ? Math.round((w >= h ? windowH / h : windowW / w) * 100) / 100
          : 1,
      translateStart: 0,
    };
    // Make sure we consider box horizontal if the scrolling will need to be horizontal &&
    // vertical if the scrolling will need to be vertical:
    if (box.isWidthOversized && !box.isHeightOversized) box.isHoriz = true;
    else if (box.isHeightOversized && !box.isWidthOversized)
      box.isHoriz = false;
    box.translateStart = box.isHoriz
      ? box.isWidthOversized
        ? (box.width - window.innerWidth) / 2
        : 0
      : 0; /* box.isHeightOversized
        ? (box.height - window.innerHeight) / 2
        : 0; */
    console.log('box', box);
    // Fade image in:
    if (firstBoxLoaded) setTimeout(() => performFadeIn(false), boxFadeDelay);
    else {
      firstBoxLoaded = true;
      performFadeIn(true);
    }
  });
  $page?.appendChild($boxImage);
}

// On manual scroll cancel any auto-scroll that might be happening:

function handleScroll(): void {
  // Cancel any box swipe thru that might be happening:
  swipeThruToBeHalted = true;
}

const $page = document.querySelector('.page');
if (!$page) throw new Error('$page is null');
// On dbl-click move to prev image:
$page.addEventListener('dblclick', handleDblClick);
// On click move to next image:
$page.addEventListener('click', handleClick);
// On manual scroll cancel any auto-scroll that might be happening:
if (cancelAutoSwipeOnUserScroll)
  window.addEventListener('scroll', handleScroll);
// Fade first image in:
document.addEventListener('DOMContentLoaded', handleOnLoad);
