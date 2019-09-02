'use strict';

function SimonGame (highlightMs, delayMs){
  this.challengeArr = [];
  this.playerClicksArr = [];
  this.highlightMs = highlightMs;
  this.delayMs = delayMs;
  this.points = 0;
  this.buttons = [
    new SimonButton($('#simon_top_left').first(), this),
    new SimonButton($('#simon_top_right').first(), this),
    new SimonButton($('#simon_bottom_left').first(), this),
    new SimonButton($('#simon_bottom_right').first(), this),
  ];
}

SimonGame.prototype.start = function (){
  this.points = 0;
  this.challengeArr = [];
  this.nextRound();
}

SimonGame.prototype.nextRound = function (){
  this.playerClicksArr = [];
  let selectedButtonIndex = Math.floor(Math.random() * this.buttons.length);
  this.challengeArr.push(this.buttons[selectedButtonIndex]);
  this.presentChallenge(this.challengeArr, 0);
}

SimonGame.prototype.presentChallenge = function (arr, currentIndex){
  if(currentIndex >= arr.length){
    return;
  }
  arr[currentIndex].highlight(() => {
    setTimeout(() => {
      this.presentChallenge(arr, currentIndex+1);
    }, this.delayMs);
  })
}

SimonGame.prototype.verifyOrder = function (){
  if(this.playerClicksArr.length > this.challengeArr.length){
    return false;
  }
  for (let i=0; i<this.playerClicksArr.length; i++){
    if(this.playerClicksArr[i] !== this.challengeArr[i]){
      return false;
    }
  }
  return true;
}

SimonGame.prototype.lose = function (){
  alert('you lost');
}

function SimonButton (buttonEl, game){
  this.buttonEl = buttonEl;
  this.game = game;
  buttonEl.on('click', (e) => {
    this.highlight(() => {
      this.game.playerClicksArr.push(this);
      if(!this.game.verifyOrder()){
        this.game.lose();
      } else if(this.game.playerClicksArr.length === this.game.challengeArr.length) {
        setTimeout(() => {
          this.game.points += this.game.challengeArr.length;
          this.game.nextRound();
        }, this.game.delayMs*2);
      }
    });
  });
}

SimonButton.prototype.highlight = function (onHightlightDone){
  const button = this;
  button.buttonEl.addClass('simon_button_lit');
  setTimeout(() => {
    button.buttonEl.removeClass('simon_button_lit');
    onHightlightDone();
  }, button.game.highlightMs);
}

var simon = new SimonGame(500, 250);
