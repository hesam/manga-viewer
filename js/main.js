'use strict';
const numImages = 10;
const $boxImage = document.querySelector('.box');
let currentIndex = 0;
function showIndex(targetIndex) {
  if (!$boxImage) throw new Error('Image not found!');
  currentIndex = targetIndex;
  $boxImage.setAttribute('src', `images/${currentIndex}.png`);
}
function getNextIndex() {
  if (currentIndex === numImages - 1) {
    return 0;
  } else {
    return currentIndex + 1;
  }
}
/*
function getPreviousIndex(): number {
  if (currentIndex === 0) {
    return numImages - 1;
  } else {
    return currentIndex - 1;
  }
}
  */
function handleClick() {
  showIndex(getNextIndex());
}
const $page = document.querySelector('.page');
if (!$page) throw new Error('$page is null');
$page.addEventListener('click', handleClick);
