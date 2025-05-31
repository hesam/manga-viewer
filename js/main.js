'use strict';
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
const comicSets = [
  {
    title: 'Krazy Kat',
    titleImageIndex: 12,
    setLabel: 'a',
    numBoxes: 23,
  },
  {
    title: 'B',
    titleImageIndex: 0,
    setLabel: 'b',
    numBoxes: 10,
  },
  { title: 'C', titleImageIndex: 0, setLabel: 'c', numBoxes: 7 },
  {
    title: 'D',
    titleImageIndex: 0,
    setLabel: 'd',
    numBoxes: 10,
  },
];
let randomComic;
let numBoxes;
let imagesetLabel;
let audiosetLabel;
let currIndex = 0;
let $boxImage = null;
let singleClickTimeout = null;
let fadeStepTimeout = null;
let swipeThruToBeHalted = true;
let box;
let opacity = opacityMin;
let scale = scaleMax;
let translateX = 0;
let translateY = 0;
let fadeAnimationBusy = false;
function showIndex(targetIndex) {
  // console.log(targetIndex);
  currIndex = targetIndex;
  performFadeOutThenIn();
}
// Animate prev box fading out then next box into view:
function performFadeOutThenIn() {
  performFadeInOut(
    opacityMax,
    opacityMin,
    1,
    scaleMax,
    box.translateStart,
    0,
    box.isHoriz,
    true,
  );
}
// Animate box fading in to view:
function performFadeIn() {
  performFadeInOut(
    opacityMin,
    opacityMax,
    scaleMax,
    1,
    0,
    box.translateStart,
    box.isHoriz,
    false,
  );
}
// Helper to animate box fade out/in:
function performFadeInOut(
  opacityStart,
  opacityEnd,
  scaleStart,
  scaleEnd,
  translateStart,
  translateEnd,
  translateIsHoriz,
  isFadeOutThenIn,
) {
  // Reset the scroll for next box:
  if (!isFadeOutThenIn) window.scrollTo({ left: 0, top: 0 });
  // console.log(translateStart, translateEnd);
  const translateIncr =
    Math.round(((translateEnd - translateStart) / numFadeSteps) * 10) / 10;
  fadeStepTimeout = setInterval(() => {
    opacity +=
      Math.round(((opacityEnd - opacityStart) / numFadeSteps) * 100) / 100;
    scale += Math.round(((scaleEnd - scaleStart) / numFadeSteps) * 1000) / 1000;
    if (translateIsHoriz) translateX += translateIncr;
    else translateY += translateIncr;
    $boxImage.style.opacity = String(opacity);
    $boxImage.style.transform = `scale(${scale}) translate${translateIsHoriz ? 'X' : 'Y'}(${translateIsHoriz ? translateX : translateY}px)`;
    if (Math.abs(opacity - opacityEnd) < 0.01) {
      if (fadeStepTimeout) {
        clearInterval(fadeStepTimeout);
        fadeStepTimeout = null;
      }
      $boxImage.style.opacity = String(opacityEnd);
      $boxImage.style.transform = `scale(${scaleEnd}) translate${translateIsHoriz ? 'X' : 'Y'}(${translateEnd}px)`;
      scale = scaleEnd;
      if (translateIsHoriz) translateX = translateEnd;
      else translateY = translateEnd;
      if (isFadeOutThenIn) {
        // Create a new image for the next box, which will also cause the image 'load' event to refire once the new image is loaded:
        createBoxImage();
        return;
      } else {
        $boxImage?.classList.remove('faded-out');
        if (box.isWidthOversized || box.isHeightOversized) {
          if (boxSwipeThruOn) {
            setTimeout(() => {
              performBoxSwipeThru(
                box.isHoriz ? box.width : box.height,
                box.isHoriz,
              );
            }, swipeThruDelay);
          }
        }
      }
      fadeAnimationBusy = false;
    }
  }, boxFadeDelay / numFadeSteps);
}
// Animate scrolling through a box (when zoom scale > 1):
function performBoxSwipeThru(scrollEnd, scrollIsHoriz) {
  let prevDistance = 0;
  swipeThruToBeHalted = false;
  function animationStep() {
    if (swipeThruToBeHalted) return;
    const scroll = scrollIsHoriz ? window.scrollX : window.scrollY;
    const distance = scrollEnd - scroll;
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
const getNextIndex = () => (currIndex === numBoxes - 1 ? 0 : currIndex + 1);
const getPrevIndex = () => (currIndex === 0 ? numBoxes - 1 : currIndex - 1);
// On click move to next image:
function handleClick() {
  // Delay the click handler slightly to ignore if it's a double-click:
  // If there's already a timer, let it continue:
  if (fadeAnimationBusy || singleClickTimeout) return;
  // Cancel any box swipe thru that might be happening:
  swipeThruToBeHalted = true;
  singleClickTimeout = setTimeout(() => {
    fadeAnimationBusy = true;
    showIndex(getNextIndex());
    singleClickTimeout = null;
  }, singleClickDelay);
}
// On dbl-click move to prev image:
function handleDblClick() {
  if (fadeAnimationBusy) return;
  fadeAnimationBusy = true;
  singleClickTimeout && clearTimeout(singleClickTimeout); // Prevent single click from firing
  showIndex(getPrevIndex());
  singleClickTimeout = null;
}
// Once a box image is loaded in the document, record image dimensions, etc.:
function handleBoxImageLoaded() {
  const windowW = window.innerWidth;
  const windowH = window.innerHeight;
  const ow = $boxImage.width;
  const oh = $boxImage.height;
  const w = ow + 2 * boxBorderWidth;
  const h = oh + 2 * boxBorderWidth;
  box = {
    width: w,
    height: h,
    isHoriz: w >= h,
    isWidthOversized: false,
    isHeightOversized: false,
    scaleDownBy:
      w > windowW && h > windowH
        ? Math.round((ow >= oh ? windowH / oh : windowW / ow) * 1000000) /
          1000000
        : 1,
    translateStart: 0,
  };
  box.isWidthOversized = Math.round(w * box.scaleDownBy) > windowW;
  box.isHeightOversized = Math.round(h * box.scaleDownBy) > windowH;
  // Make sure we consider box horizontal if the scrolling will need to be horizontal &&
  // vertical if the scrolling will need to be vertical:
  if (box.isWidthOversized && !box.isHeightOversized) box.isHoriz = true;
  else if (box.isHeightOversized && !box.isWidthOversized) box.isHoriz = false;
  box.translateStart = box.isHoriz
    ? box.isWidthOversized
      ? (box.width * box.scaleDownBy - window.innerWidth) / 2
      : 0
    : 0;
  // Scale the actual box image dimensions to fit one (shorter) site in screen:
  if (box.scaleDownBy < 1) {
    $boxImage.width = ow * box.scaleDownBy;
    $boxImage.height = oh * box.scaleDownBy;
  }
  // console.log('box', box);
  performFadeIn();
}
// Creates an image element for the upcoming box and adds to DOM:
function createBoxImage() {
  // Remove any previous box image first:
  if ($boxImage) $boxImage.remove();
  // Create a new one:
  $boxImage = document.createElement('img');
  $boxImage.className = 'box faded-out';
  $boxImage.setAttribute('alt', 'box');
  $boxImage.setAttribute('src', `images/${imagesetLabel}${currIndex + 1}.png`);
  $boxImage.setAttribute('draggable', 'false');
  $boxImage.addEventListener('load', handleBoxImageLoaded);
  $page?.appendChild($boxImage);
}
function handleOnLoad() {
  window.scrollTo(0, 0);
  comicSets.forEach((comic, idx) => {
    // Create a gallery item for the comic:
    const $galleryItem = document.createElement('div');
    $galleryItem.className = 'gallery-item box';
    $galleryItem.setAttribute('data-comic-id', String(idx));
    $galleryItem.style.transform = `rotate(${Math.floor(Math.random() * 10) - 5}deg)`;
    const $galleryItemImage = document.createElement('img');
    $galleryItemImage.className = 'gallery-item-img';
    $galleryItemImage.setAttribute('alt', 'gallery-item-' + comic.title);
    $galleryItemImage.setAttribute(
      'src',
      `images/${comic.setLabel}${comic.titleImageIndex + 1}.png`,
    );
    $galleryItemImage.setAttribute('draggable', 'false');
    const $galleryItemTitle = document.createElement('h2');
    $galleryItemTitle.className = 'gallery-item-title';
    $galleryItemTitle.textContent = comic.title;
    $galleryItem.appendChild($galleryItemImage);
    $galleryItem.appendChild($galleryItemTitle);
    $galleryItems.appendChild($galleryItem);
  });
}
// On manual scroll cancel any auto-scroll that might be happening:
function handleScroll() {
  // Cancel any box swipe thru that might be happening:
  swipeThruToBeHalted = true;
}
// Handle picking a comic: Fade first image in...
function handleGalleryPick(e) {
  let $clickedElement = e.target;
  // Reject if clicked outside a comic area:
  if (
    !(
      $clickedElement.tagName === 'IMG' ||
      $clickedElement.classList.contains('gallery-item')
    )
  )
    return;
  // Find the outer container element for the comic in the gallery
  if ($clickedElement.tagName === 'IMG')
    $clickedElement = $clickedElement.closest('.gallery-item');
  window.scrollTo(0, 0);
  // Record the index of comic picked:
  const comicId = +$clickedElement.dataset.comicId;
  // Record data associated with the picked comic:
  randomComic = comicSets[comicId]; // Math.floor(Math.random() * numComicSets)];
  numBoxes = randomComic.numBoxes;
  imagesetLabel = randomComic.setLabel;
  audiosetLabel = 1 + Math.floor(Math.random() * numAudioSets);
  // Create img element for comic:
  createBoxImage();
  $gallery.classList.add('hidden');
  $page.classList.remove('hidden');
  // On dbl-click move to prev image:
  $page.addEventListener('dblclick', handleDblClick);
  // On click move to next image:
  $page.addEventListener('click', handleClick);
  // On manual scroll cancel any auto-scroll that might be happening:
  if (cancelAutoSwipeOnUserScroll)
    window.addEventListener('scroll', handleScroll);
  // Select bg audio randomly and play:
  if (audioOn) {
    const $bgAudio = document.querySelector('#bg-audio');
    if ($bgAudio) {
      $bgAudio.setAttribute('src', `audio/${audiosetLabel}.mp3`);
      $bgAudio.loop = true;
      $bgAudio.play();
    }
  }
}
const $gallery = document.querySelector('.gallery');
const $galleryItems = document.querySelector('.gallery-items');
const $page = document.querySelector('.page');
const $nav = document.querySelector('.nav');
if (!($page || $gallery || $galleryItems || $nav))
  throw new Error('Problem loading page!');
// On click to pick a comic:
$galleryItems.addEventListener('click', handleGalleryPick);
// On click move to next image:
$nav.addEventListener('click', () => window.location.reload());
// Dynamically load to comics gallery to pick from:
document.addEventListener('DOMContentLoaded', handleOnLoad);
