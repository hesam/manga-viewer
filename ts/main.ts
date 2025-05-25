const numImages = 10;
const boxFadeDelay = 500;
// Adjust delay to match typical double-click speed:
const singleClickDelay = 250;

const $boxImage = document.querySelector('.box');
if (!$boxImage) throw new Error('Image not found!');

let currentIndex = 1;
let singleClickTimeout: NodeJS.Timeout | null = null;

function showIndex(targetIndex: number): void {
  console.log(targetIndex);
  currentIndex = targetIndex;
  $boxImage?.classList.add('faded-out');
  setTimeout(() => {
    $boxImage!.setAttribute('src', `images/${currentIndex}.png`);
    $boxImage?.classList.remove('faded-out');
  }, boxFadeDelay);
}

function getNextIndex(): number {
  if (currentIndex === numImages) {
    return 1;
  } else {
    return currentIndex + 1;
  }
}

function getPrevIndex(): number {
  if (currentIndex === 1) {
    return numImages;
  } else {
    return currentIndex - 1;
  }
}

function handleClick(): void {
  // Delay the click handler slightly to ignore if it's a double-click:
  // If there's already a timer, let it continue:
  if (singleClickTimeout) return;
  singleClickTimeout = setTimeout(() => {
    showIndex(getNextIndex());
    singleClickTimeout = null;
  }, singleClickDelay);
}

function handleDblClick(): void {
  singleClickTimeout && clearTimeout(singleClickTimeout); // Prevent single click from firing
  showIndex(getPrevIndex());
  singleClickTimeout = null;
}

function handleOnLoad(): void {
  showIndex(currentIndex);
}

const $page = document.querySelector('.page');
if (!$page) throw new Error('$page is null');
$page.addEventListener('dblclick', handleDblClick);
$page.addEventListener('click', handleClick);
document.addEventListener('DOMContentLoaded', handleOnLoad);
