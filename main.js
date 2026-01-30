import { Game } from "./src/game.js";

const canvas = document.getElementById("sheet");
const ui = {
  currentTeamLabel: document.getElementById("currentTeam"),
  stonesLeftLabel: document.getElementById("stonesLeft"),
  shotNumberLabel: document.getElementById("shotNumber"),
  endNumberLabel: document.getElementById("endNumber"),
  hammerTeamLabel: document.getElementById("hammerTeam"),
  turnIndicator: document.getElementById("turnIndicator"),
  speedLabel: document.getElementById("speed"),
  spinLabel: document.getElementById("spin"),
  distanceLabel: document.getElementById("distance"),
  sweepStatusLabel: document.getElementById("sweepStatus"),
  scoreLabels: [
    document.getElementById("scoreTeam0"),
    document.getElementById("scoreTeam1"),
  ],
  teamCards: document.querySelectorAll(".team-card"),
  shotHistoryList: document.getElementById("shotHistory"),
  endSummary: document.getElementById("endSummary"),
  presetButtons: document.querySelectorAll(".preset"),
  powerInput: document.getElementById("power"),
  curlInput: document.getElementById("curl"),
  angleInput: document.getElementById("angle"),
  powerValue: document.getElementById("powerValue"),
  curlValue: document.getElementById("curlValue"),
  angleValue: document.getElementById("angleValue"),
  endsSetting: document.getElementById("endsSetting"),
  aiDifficulty: document.getElementById("aiDifficulty"),
};

const controls = {
  throwButton: document.getElementById("throwStone"),
  sweepButton: document.getElementById("sweep"),
  undoButton: document.getElementById("undoShot"),
  resetEndButton: document.getElementById("resetEnd"),
  scoreEndButton: document.getElementById("scoreEnd"),
  newGameButton: document.getElementById("newGame"),
};

const game = new Game(canvas, ui, controls);

game.start();
