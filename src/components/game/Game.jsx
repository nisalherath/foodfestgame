import React, { useEffect, useState, useRef } from 'react';
import doodlerRightImgSrc from '../assets/doodler-right.png';
import doodlerLeftImgSrc from '../assets/doodler-left.png';
import platformImgSrc from '../assets/platform.png';
import restartImgSrc from '../assets/restart.png'; // Import restart image
import './game.css';
import { getDoc, doc, getFirestore, setDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import { app } from '../firebase/Firebase'; // Import Firebase app instance

const Game = () => {
  const boardRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [restartImg, setRestartImg] = useState(null); // Initialize with null
  const [highscore, setHighscore] = useState(0); // Initialize highscore state
  const [localHighscore, setLocalHighscore] = useState(0); // Initialize local highscore state
  let restartEventListenerAdded = false; // Track if restart event listener is added

  let board;
  let boardWidth = 360;
  let boardHeight = 576;
  let context;

  // Doodler
  let doodlerWidth = 60;
  let doodlerHeight = 60;
  let doodlerX = boardWidth / 2 - doodlerWidth / 2;
  let doodlerY = (boardHeight * 7) / 8 - doodlerHeight;
  let doodlerRightImg = new Image();
  let doodlerLeftImg = new Image();

  let doodler = {
    img: null,
    x: doodlerX,
    y: doodlerY,
    width: doodlerWidth,
    height: doodlerHeight,
  };

  // Physics
  let velocityX = 0;
  let velocityY = 0; // Doodler jump speed
  let initialVelocityY = -8; // Starting velocity Y
  let gravity = 0.4;

  // Platforms
  let platformArray = [];
  let platformWidth = 70;
  let platformHeight = 22;
  let platformImg = new Image();

  let score = 0;
  let gameOver = false;
  let bounceCount = 0; // Track bounce count

  useEffect(() => {
    if (gameStarted) {
      board = document.getElementById('board');
      board.height = boardHeight;
      board.width = boardWidth;
      context = board.getContext('2d'); // Used for drawing on the board

      // Load images
      doodlerRightImg.src = doodlerRightImgSrc;
      doodler.img = doodlerRightImg;
      doodlerRightImg.onload = () => {
        context.drawImage(
          doodler.img,
          doodler.x,
          doodler.y,
          doodler.width,
          doodler.height
        );
      };

      doodlerLeftImg.src = doodlerLeftImgSrc;

      platformImg.src = platformImgSrc;

      velocityY = initialVelocityY;
      placePlatforms();
      requestAnimationFrame(update);
      document.addEventListener('keydown', moveDoodler);

      return () => {
        document.removeEventListener('keydown', moveDoodler);
      };
    }
  }, [gameStarted]);

  useEffect(() => {
    // Preload the restart image
    const img = new Image();
    img.src = restartImgSrc;
    img.onload = () => {
      setRestartImg(img);
    };
  }, []);

  useEffect(() => {
    const savedHighscore = Cookies.get('highscore');
    if (savedHighscore) {
      const parsedHighscore = parseInt(savedHighscore);
      setLocalHighscore(parsedHighscore); // Set local highscore from the cookie
      if (parsedHighscore > highscore) {
        // Update the highscore state only if the cookie highscore is greater than the current state
        setHighscore(parsedHighscore);
      }
    }
  }, []);
  

  useEffect(() => {
    // Periodically update database highscore every 5 minutes
    const intervalId = setInterval(() => {
      updateDatabaseHighscore();
    }, 1 * 60 * 1000); // 5 minutes interval

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  function updateDatabaseHighscore() {
    const savedNickname = Cookies.get('nickname');
    if (savedNickname) {
      const db = getFirestore(app);
      const userRef = doc(db, 'nicknames', savedNickname);

      getDoc(userRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const dbHighscore = docSnap.data().highscore || 0;
            const localHighscore = parseInt(Cookies.get('highscore')) || 0;

            if (localHighscore > dbHighscore) {
              // Update both nickname and highscore together
              setDoc(userRef, { nickname: savedNickname, highscore: localHighscore })
                .then(() => {
                  console.log('Nickname and Highscore updated to the database successfully');
                })
                .catch((error) => {
                  console.error('Error updating nickname and highscore to the database:', error);
                });
            }
          }
        })
        .catch((error) => {
          console.error('Error getting document:', error);
        });
    }
  }

  function startGame() {
    setGameStarted(true);
  
    // Scroll the canvas into view when the game starts
    if (boardRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect(); // Get the board's bounding rectangle
      const viewportHeight = window.innerHeight; // Get the viewport's height
      const scrollY = boardRect.top - (viewportHeight - boardRect.height) / 2; // Calculate the scroll position to center the board
      window.scrollTo({ top: scrollY, behavior: 'smooth' }); // Scroll to the calculated position
    }
  }
  

  function restartGame() {
    doodler = {
      img: doodlerRightImg,
      x: doodlerX,
      y: doodlerY,
      width: doodlerWidth,
      height: doodlerHeight,
    };

    velocityX = 0;
    velocityY = initialVelocityY;
    score = 0; // Reset score to 0
    gameOver = false;
    placePlatforms();
    bounceCount = 0; // Reset bounce count

    if (boardRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect(); // Get the board's bounding rectangle
      const viewportHeight = window.innerHeight; // Get the viewport's height
      const scrollY = boardRect.top - (viewportHeight - boardRect.height) / 2; // Calculate the scroll position to center the board
      window.scrollTo({ top: scrollY, behavior: 'smooth' }); // Scroll to the calculated position
    }
  }

  function update() {
    requestAnimationFrame(update);
    if (gameOver) {
      return;
    }
    context.clearRect(0, 0, board.width, board.height);

    // Set board background color
    const colors = [
      'rgb(255, 199, 144)', 
      'rgb(179, 244, 255)',
      'rgb(145, 248, 176)', 
      'rgb(250, 199, 255)', 
      'rgb(220, 220, 220)' 
    ];
    const colorIndex = Math.floor(score / 1000) % colors.length; // Calculate the index of the current color
    context.fillStyle = colors[colorIndex];
    context.fillRect(0, 0, board.width, board.height);

    // Doodler
    doodler.x += velocityX;
    if (doodler.x > boardWidth) {
      doodler.x = 0;
    } else if (doodler.x + doodler.width < 0) {
      doodler.x = boardWidth;
    }
    

    velocityY += gravity;
    doodler.y += velocityY;
    if (doodler.y > board.height) {
      gameOver = true;
    }
    context.drawImage(
      doodler.img,
      doodler.x,
      doodler.y,
      doodler.width,
      doodler.height
    );

    // Platforms
    for (let i = 0; i < platformArray.length; i++) {
      let platform = platformArray[i];
      platform.y += 4;
      if (velocityY < 0 && doodler.y < boardHeight * 3 / 4) {
        platform.y -= initialVelocityY; // Slide platform down
      }
      if (detectCollision(doodler, platform) && velocityY >= 0) {
        velocityY = initialVelocityY; // Jump
        bounceCount++; // Increment bounce count
        if (bounceCount >= 5) {
          gameOver = true; // End game if bounce count reaches limit
        }
      }
      context.drawImage(
        platform.img,
        platform.x,
        platform.y,
        platform.width,
        platform.height
      );
    }

    // Clear platforms and add new platform
    while (platformArray.length > 0 && platformArray[0].y >= boardHeight) {
      platformArray.shift(); // Removes first element from the array
      newPlatform(); // Replace with new platform on top
      bounceCount = 0; // Reset bounce count when platform removed
    }

    // Score
    updateScore();
    context.fillStyle = 'black';
    context.font = '16px Poppins';
    context.fillText(Math.floor(score), 5, 20);


    if (gameOver && restartImg) { // Check if restartImg is loaded
      // Draw opaque black backdrop
      context.fillStyle = 'rgba(63, 0, 0, 0.6)';
      context.fillRect(0, 0, boardWidth, boardHeight);
      // Show restart image
      context.drawImage(restartImg, boardWidth / 2 - doodlerWidth / 2, boardHeight / 2 - doodlerHeight / 2, doodlerWidth, doodlerHeight);
      // Show highscore
      context.fillStyle = 'white'; // Set text color to white
      context.font = '20px Poppins'; // Set font family and size
      
      const text = `Your Highscore: ${localHighscore}`; 
      const textWidth = context.measureText(text).width; // Measure the width of the text
      const textX = (boardWidth - textWidth) / 2; // Calculate the x-coordinate to center the text horizontally
    
      context.fillText(text, textX, boardHeight / 2 + 50); // Draw the text
      // Add click event listener for restart button only if it's not added yet
      if (!restartEventListenerAdded) {
        board.addEventListener('click', handleRestartClick);
        restartEventListenerAdded = true;
      }
    } else {
      // If game is not over or restartImg is not loaded, remove the event listener
      board.removeEventListener('click', handleRestartClick);
      restartEventListenerAdded = false;
    }
  }

  function handleRestartClick(event) {
    const { offsetX, offsetY } = event;
    if (
      offsetX >= boardWidth / 2 - doodlerWidth / 2 &&
      offsetX <= boardWidth / 2 + doodlerWidth / 2 &&
      offsetY >= boardHeight / 2 - doodlerHeight / 2 &&
      offsetY <= boardHeight / 2 + doodlerHeight / 2
    ) {
      restartGame();
    }
  }

  // Touch event variables
  let touchStartX = 0;
  let touchStartY = 0;

  // Handle touch start event
  function handleTouchStart(event) {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  // Handle touch move event
  function handleTouchMove(event) {
    if (gameStarted) {
      event.preventDefault(); // Prevent scrolling
    }
  }

  function handleTouchEnd(event) {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        // Swipe right
        velocityX = 7; // Increase velocityX for a more sensitive swipe
        doodler.img = doodlerRightImg;
      } else {
        // Swipe left
        velocityX = -7; // Increase velocityX for a more sensitive swipe
        doodler.img = doodlerLeftImg;
      }
    } else {
      // Vertical swipe
      if (deltaY < 0) {
        // Swipe up
        if (!gameOver && velocityY === 0) {
          // Only allow jumping if not gameOver and the doodler is not already jumping or falling
          velocityY = initialVelocityY * 2; // Increase jump velocity for a swipe up
          bounceCount = 0; // Reset bounce count
        }
      }
    }
  }
  
  

  // Add touch event listeners
  useEffect(() => {
    board = document.getElementById('board');
    board.addEventListener('touchstart', handleTouchStart);
    board.addEventListener('touchmove', handleTouchMove);
    board.addEventListener('touchend', handleTouchEnd);

    return () => {
      board.removeEventListener('touchstart', handleTouchStart);
      board.removeEventListener('touchmove', handleTouchMove);
      board.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameStarted]); // Add gameStarted as a dependency

  function moveDoodler(e) {
    if (e.code == 'ArrowRight' || e.code == 'KeyD') {
      // Move right
      velocityX = 4;
      doodler.img = doodlerRightImg;
    } else if (e.code == 'ArrowLeft' || e.code == 'KeyA') {
      // Move left
      velocityX = -4;
      doodler.img = doodlerLeftImg;
    } else if (e.code == 'Space' && gameOver) {
      // Reset
      restartGame();
    }
  }

  function placePlatforms() {
    platformArray = [];

    // Starting platforms
    let platform = {
      img: platformImg,
      x: boardWidth / 2,
      y: boardHeight - 50,
      width: platformWidth,
      height: platformHeight,
    };

    platformArray.push(platform);

    for (let i = 0; i < 6; i++) {
      let randomX = Math.floor(Math.random() * boardWidth * 3 / 4); // (0-1) * boardWidth*3/4
      let platform = {
        img: platformImg,
        x: randomX,
        y: boardHeight - 75 * i - 150,
        width: platformWidth,
        height: platformHeight,
      };

      platformArray.push(platform);
    }
  }

  function newPlatform() {
    let randomX = Math.floor(Math.random() * boardWidth * 3 / 4); // (0-1) * boardWidth*3/4
    let platform = {
      img: platformImg,
      x: randomX,
      y: -platformHeight,
      width: platformWidth,
      height: platformHeight,
    };

    platformArray.push(platform);
  }

  function detectCollision(a, b) {
    return (
      a.x < b.x + b.width && // A's top left corner doesn't reach B's top right corner
      a.x + a.width > b.x && // A's top right corner passes B's top left corner
      a.y < b.y + b.height && // A's top left corner doesn't reach B's bottom left corner
      a.y + a.height > b.y
    ); // A's bottom left corner passes B's top left corner
  }

function updateScore() {
  if (velocityY < 0) {
    // Character is going upwards
    score += Math.abs(velocityY); // Increment score when character goes up
  }

  const savedHighscore = Cookies.get('highscore');
  if (savedHighscore) {
    const parsedHighscore = parseInt(savedHighscore);
    if (score > parsedHighscore) {
      // Update local highscore from the cookie if current score is higher
      console.log('Updating local highscore:', score);
      setLocalHighscore(score);
      Cookies.set('highscore', score, { expires: 365 }); // Update cookie
    } else {
      // Use the saved highscore from the cookie
      console.log('Using saved highscore:', parsedHighscore);
      setLocalHighscore(parsedHighscore);
    }
  } else {
    // If there's no saved highscore in the cookie, update the local highscore
    console.log('No saved highscore found. Setting local highscore to current score:', score);
    setLocalHighscore(score);
    Cookies.set('highscore', score, { expires: 365 }); // Set cookie with 1 year expiry
  }

  if (score >= highscore) {
    // Update the highscore state if the current score is higher or equal to the highscore
    console.log('Updating highscore:', score);
    setHighscore(score);
  }
}

  

  return (
    <div className="game-container">
      <div
        className="game-overlay"
        style={{ display: !gameStarted ? 'flex' : 'none' }}
      >
        <button onClick={startGame} className="game-button">
          
        </button>
      </div>
      <canvas
        id="board"
        ref={boardRef} // Assign the reference to the game board element
        className="game-canvas"
        style={{ display: gameStarted ? 'block' : 'none' }}
        width={boardWidth}
        height={boardHeight}
      />
    </div>
  );
};

export default Game;
