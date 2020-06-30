//Create a Pixi Application
let app = new PIXI.Application({ 
    width: window.innerWidth,         // default: 800
    height: window.innerHeight,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1,       // default: 1
    autoResize: true
  }
);
let loader = PIXI.loader;

window.addEventListener('resize', resize);

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);
  
var breakFalldown = false;
let left = keyboard("ArrowLeft"),
    up = keyboard("ArrowUp"),
    right = keyboard("ArrowRight"),
    down = keyboard("ArrowDown");

let creatureTemplates = [
    {
        resourcePath: 'images/creatures/creature1.png',
        width: 114/2,
        height: 138/2
    },
    {
        resourcePath: 'images/creatures/creature2.png',
        width: 150/2.5,
        height: 236/2.5
    },
    {
        resourcePath: 'images/creatures/creature3.png',
        width: 160/2.5,
        height: 150/2.5
    },
    {
        resourcePath: 'images/creatures/creature4.png',
        width: 164/2.5,
        height: 150/2.5
    },
    {
        resourcePath: 'images/creatures/creature5.png',
        width: 163/2.5,
        height: 150/2.5
    },
    {
        resourcePath: 'images/creatures/creature6.png',
        width: 150/2.5,
        height: 173/2.5
    }
];
let startScene, gameScene, gameOverScene;
let universeSprite, stiftSprite, playSprite, state, stageStartTime, destroyedStageCreatures, destroyedCreatures, allStageCreatures, allCreatures, level;
let creatures = [];
let addedGameLoopTicker = false;
let showFPS = false;

let headerStyle = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 80,
    fill: "#ff3300",
    stroke: 'blue',
    strokeThickness: 4,
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
});
let defaultStageMessageStyle = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 36,
    fill: "white",
    stroke: 'black',
    strokeThickness: 2,
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 10,
    dropShadowDistance: 6,
});
let fpsStyle = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 15,
    fill: "white"
});
let endStyle = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 36,
    fill: "white",
    stroke: '#ff3300',
    strokeThickness: 4,
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
});
resize();

let headerText = new PIXI.Text('Das Stift Adventure', headerStyle);
headerText.position.set(app.screen.width/2, 100);
headerText.anchor.set(0.5);
let levelText = new PIXI.Text('Level ' + level, defaultStageMessageStyle);
levelText.position.set(50, 50);
let fpsText = new PIXI.Text('FPS: ' + Math.round(app.ticker.FPS), fpsStyle);
fpsText.position.set(5, 5);
let endText = new PIXI.Text('You won!', endStyle);
endText.anchor.set(0.5);
endText.position.set(app.screen.width/2, app.screen.height/1.5);

    
for(let i = 0; i < creatureTemplates.length; i++){
    loader.add(creatureTemplates[i].resourcePath);
}

loader
  .add("images/universe.jpg")
  .add("images/stift.png")
  .add("images/play.png")
  .load(setup);

function setup() {
    //This code will run when the loader has finished loading the image
    
    universeSprite = new PIXI.Sprite(
        loader.resources["images/universe.jpg"].texture
    );
    app.stage.addChild(universeSprite);
    
    playSprite = new PIXI.Sprite(
        loader.resources["images/play.png"].texture
    );
    playSprite.anchor.set(0.5);
    playSprite.x = app.screen.width/2;
    playSprite.y = app.screen.height/2;
    playSprite.interactive = true;
    playSprite.buttonMode = true;
    playSprite.on('mousedown', initGame);
    startScene = new PIXI.Container();
    startScene.addChild(headerText);
    startScene.addChild(playSprite);
    app.stage.addChild(startScene);
    
    gameScene = new PIXI.Container();
    app.stage.addChild(gameScene);
    gameScene.visible = false;
    gameScene.addChild(levelText);
    if(showFPS){
        gameScene.addChild(fpsText);
    }

    
    playSprite2 = new PIXI.Sprite(
        loader.resources["images/play.png"].texture
    );
    playSprite2.anchor.set(0.5);
    playSprite2.x = app.screen.width/2;
    playSprite2.y = app.screen.height/2;
    playSprite2.interactive = true;
    playSprite2.buttonMode = true;
    playSprite2.on('mousedown', initGame);
    gameOverScene = new PIXI.Container();
    gameOverScene.addChild(playSprite2);
    gameOverScene.addChild(endText);
    app.stage.addChild(gameOverScene);
    gameOverScene.visible = false;
        
    stiftSprite = new PIXI.Sprite(
        loader.resources["images/stift.png"].texture
    );
    
    stiftSprite.position.set(app.screen.width/4, app.screen.height/2);
    stiftSprite.width = 45;
    stiftSprite.height = 75;
    gameScene.addChild(stiftSprite);
}

function initGame(){
    stiftSprite.position.set(app.screen.width/4, app.screen.height/2);
    allCreatures = 0;
    destroyedCreatures = 0;
    level = 1;
    loadStage(level);
    
    startScene.visible = false;
    gameScene.visible = true;
    gameOverScene.visible = false;
    state = play;
    if(!addedGameLoopTicker){
        addedGameLoopTicker = true;
        app.ticker.add(delta => gameLoop(delta));
    }
}

function loadStage(level=0, initialCreatures=3){
    levelText.text = 'Level ' + level;
    destroyedStageCreatures = 0;
    stageStartTime = new Date().getTime();
    createCreatures(initialCreatures+level);
}

function gameLoop(delta) {
    //Runs the current game `state` in a loop and renders the sprites
    //console.log("loop");
    
    state(delta);
}

function play(delta) {
    //All the game logic goes here
    
    if(creatures.length == 0){
        if(level < 10 && destroyedStageCreatures >= 2){
            level++;
            loadStage(level);
        } else {
            end();
        }
    }
    
    let objectMovingSteps = 5;
    if(window.innerHeight > 900){
        objectMovingSteps = 7;
    }
    if (up.isDown){
        moveup(app.screen.height, stiftSprite, objectMovingSteps);
    } else if (down.isDown){
        movedown(app.screen.height, stiftSprite, objectMovingSteps);
    }
    
    if (left.isDown){
        moveleft(app.screen.width, stiftSprite, objectMovingSteps);
    } else if (right.isDown){
        moveright(app.screen.width, stiftSprite, objectMovingSteps);
    }
    
    for(let i = 0; i < creatures.length; i++){
        if(creatures[i].delay <= new Date().getTime()){
            moveleft(app.screen.width, creatures[i].creature, creatures[i].speed, false);
            if(hitTestRectangle(stiftSprite, creatures[i].creature)) {
                gameScene.removeChild(creatures[i].creature);
                creatures.splice(i, 1);
                destroyedCreatures++;
                destroyedStageCreatures++;
                continue;
            }
            if(creatures[i].creature.x + creatures[i].creature.width < 0){
                gameScene.removeChild(creatures[i].creature);
                creatures.splice(i, 1);
            }
        }
    }
    if(showFPS){
        fpsText.text = 'FPS: ' + Math.round(app.ticker.FPS);
    }
}

function end(){
    endText.text = 'You destroyed ' + destroyedCreatures + ' of ' + allCreatures + ' creatures in ' + level + ' levels!';
    
    gameScene.visible = false;
    gameOverScene.visible = true;
}

function Sleep(milliseconds) {
 return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getCreature() {
    let creatureTemplate = creatureTemplates[0];
    if(creatureTemplates.length > 1){
        creatureTemplate = creatureTemplates[randomInt(0, creatureTemplates.length-1)];
    }
    
    let creatureSprite = new PIXI.Sprite(
        loader.resources[creatureTemplate.resourcePath].texture
    );
    creatureSprite.width = creatureTemplate.width;
    creatureSprite.height = creatureTemplate.height;
    creatureSprite.x = app.screen.width;
    creatureSprite.y = randomInt(1, app.screen.height-creatureSprite.height);
    creature = {
        creature: creatureSprite,
        speed: randomInt(1, 10),
        delay: stageStartTime + randomInt(1000, 3000),
    };
    return creature;
}

function createCreatures(num){
    for(let i = 0; i < num; i++){
        let creature = getCreature();
        gameScene.addChild(creature.creature);
        creatures.push(creature);
    }
    allStageCreatures = num;
    allCreatures = allCreatures + num;
}

function moveup(appHeight, sprite, steps){
    if(sprite.y >= (0+steps)){
        sprite.y = sprite.y - steps;
    }
}
function movedown(appHeight, sprite, steps){
    if(sprite.y < (appHeight-sprite.height)){
        sprite.y = sprite.y + steps;
    }
}
function moveleft(appWidth, sprite, steps, stopInBorder = true){
    if((stopInBorder && sprite.x > (0+steps)) || (!stopInBorder && sprite.x >= (0-sprite.width))){
        sprite.x = sprite.x - steps;
    }
}
function moveright(appWidth, sprite, steps){
    if(sprite.x < ((appWidth-sprite.width)-steps)){
        sprite.x = sprite.x + steps;
    }
}

async function autoFalldown(appHeight, sprite){
    for(let i = sprite.y; i<(appHeight-sprite.height); i=i+2){
        if(breakFalldown){
            break;
        }
        sprite.y = sprite.y + 2;
        await Sleep(5);
    }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resize() {
    // Get the p
    const parent = app.view.parentNode;

    // Resize the renderer
    app.renderer.resize(parent.clientWidth, parent.clientHeight);
}

function keyboard(value) {
  let key = {};
  key.value = value;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = event => {
    if (event.key === key.value) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  //The `upHandler`
  key.upHandler = event => {
    if (event.key === key.value) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  //Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);
  
  window.addEventListener(
    "keydown", downListener, false
  );
  window.addEventListener(
    "keyup", upListener, false
  );
  
  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener("keydown", downListener);
    window.removeEventListener("keyup", upListener);
  };
  
  return key;
}

function hitTestRectangle(r1, r2) {

  //Define the variables we'll need to calculate
  let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

  //hit will determine whether there's a collision
  hit = false;

  //Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;

  //Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occurring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {

      //There's definitely a collision happening
      hit = true;
    } else {

      //There's no collision on the y axis
      hit = false;
    }
  } else {

    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
};
