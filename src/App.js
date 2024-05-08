import React, { useState, useEffect } from 'react';
import './App.css';
import { getDoc, doc, getFirestore, setDoc, deleteDoc } from 'firebase/firestore'; // Import deleteDoc
import Cookies from 'js-cookie';
import { app } from './components/firebase/Firebase';
import Game from './components/game/Game';
import Highscore from './components/highscore/Highscore'; 

import doodlerRightImgSrc from './components/assets/doodler-right.png';
import doodlerLeftImgSrc from './components/assets/doodler-left.png';
import platformImgSrc from './components/assets/platform.png';
import restartImgSrc from './components/assets/restart.png'; 
import formpic from './components/assets/formpic.png';


function App() {
  const [nickname, setNickname] = useState('');
  const [showNicknameAlert, setShowNicknameAlert] = useState(false);
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showClearCookiesAlert, setShowClearCookiesAlert] = useState(false);
  const [submittedWithoutNickname, setSubmittedWithoutNickname] = useState(false); // New state to track if form submitted without nickname

  useEffect(() => {
    const hasWelcomeAlertBeenShown = localStorage.getItem('welcomeAlertShown');
  
    if (!hasWelcomeAlertBeenShown && !Cookies.get('nickname')) {
      setShowWelcomeAlert(true);
      localStorage.setItem('welcomeAlertShown', 'true');
    }
  }, []);
  
  useEffect(() => {
    const savedNickname = Cookies.get('nickname');
    if (savedNickname) {
      setNickname(savedNickname);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const preloadImages = async () => {
      const images = [doodlerRightImgSrc, doodlerLeftImgSrc, platformImgSrc, restartImgSrc];
      await Promise.all(images.map((src) => loadImage(src)));
      setImagesLoaded(true);
    };

    preloadImages();
  }, []);

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = resolve;
      img.onerror = reject;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!nickname.trim()) {
      setSubmittedWithoutNickname(true); // Set state if form submitted without nickname
      setLoading(false);
      return;
    }

    try {
      // Check if a nickname cookie exists
      const savedNickname = Cookies.get('nickname');
      if (savedNickname && savedNickname !== nickname) {
        // If the submitted nickname is different from the one in the cookie, delete the existing nickname cookie
        Cookies.remove('nickname');
        // Check if there is no nickname cookie after removal
        if (!Cookies.get('nickname')) {
          // If no nickname cookie is present, remove the highscore cookie as well
          Cookies.remove('highscore');
        }
      } else if (!savedNickname) {
        // If no nickname cookie is found, remove the highscore cookie as well
        Cookies.remove('highscore');
      }

      const userRef = doc(getFirestore(app), 'nicknames', nickname);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        showAlertWithLoading(() => setShowNicknameAlert(true));
      } else {
        setShowNicknameAlert(false);
        await setDoc(userRef, { nickname: nickname, highscore: 0 });
        Cookies.set('nickname', nickname, { expires: 365 }); // Set cookie to expire in 365 days
        setIsLoggedIn(true);
        setLoading(false);
        console.log(`Logged in with username: ${nickname}`); // Log the username after successful login
        window.location.reload(); // Refresh the page after successful login
      }
    } catch (error) {
      console.error('Error adding nickname:', error);
      setLoading(false);
    }
  };

  const showAlertWithLoading = (showAlertFunction) => {
    setLoading(true);
    setTimeout(() => {
      showAlertFunction();
      setLoading(false);
    }, 2400);
  };

  const handleNicknameChange = (event) => {
    setNickname(event.target.value);
    setSubmittedWithoutNickname(false); // Reset state when nickname changes
  };

  const handleClearCookies = () => {
    setShowClearCookiesAlert(true); // Show clear cookies alert when user clicks the clear cookies button
  };

  const clearCookies = async () => {
    try {
      // Delete the Firebase document
      const userRef = doc(getFirestore(app), 'nicknames', nickname);
      await deleteDoc(userRef);

      // Remove cookies
      Cookies.remove('nickname');
      Cookies.remove('highscore');
      window.location.reload(); // Refresh the page after clearing cookies
    } catch (error) {
      console.error('Error clearing saved data:', error);
    }
  };

  const cancelClearCookies = () => {
    setShowClearCookiesAlert(false); // Hide clear cookies alert when user cancels
  };

  return (
    <div className="App">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-dots">
            <div className="dot-1"></div>
            <div className="dot-2"></div>
            <div className="dot-3"></div>
            <div className="dot-4"></div>
          </div>
        </div>
      )}

      {!isLoggedIn && imagesLoaded && (
        <div className="formcontain">
          <form onSubmit={handleSubmit} className="nickform">
            <img src={formpic} alt="Form Pic" className="formpic"/>
            <h1 id="nname">Enter Your Nickname</h1>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={handleNicknameChange}
              autoComplete="off"
            />
            {/* Conditional rendering for the message */}
            {submittedWithoutNickname && (
              <p className="nickname-message">Please enter your nickname</p>
            )}
            <div id="submitbtn">
              <button type="submit">Let's Go</button>
            </div>
          </form>
          {showNicknameAlert && (
            <div className="alert1-backdrop">
              <div className="alert1">
                <h2 id="nicknameTitle">Sorry 😔😔😔</h2>
                <h2 className="note5">Nickname already exists! Please choose a different one.</h2>
                <button onClick={() => setShowNicknameAlert(false)}>OK</button>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoggedIn && imagesLoaded && (
        <div className="wholepage">
          

        <div className="gamepage">

          <h1 className="nickname-header"><img src={formpic} alt="Form Pic" className="formpic2"/><em>{nickname}</em></h1>
          <h2 className="note"><em><b>TIP :</b></em> Only jump <em>Five</em> consecutive times on one platform!</h2>
          <Game />
          <Highscore /> 
          <h2 className="note9">
             Side Note: LeaderBoard updates every <em><b>minute</b></em>.
           Simply <em><b><a href="/" onClick={() => window.location.reload()} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'rgb(72, 78, 129)' }}>Refresh</a></b></em> the Page to see your Progress!
          </h2>

          
          <div className="clearcookie-container">
          <h2 className="note7">⚠️Disclaimer: We use cookies to save your Highscore <em><b><u>Temporarily</u></b></em> on the Page!  </h2>
            <button className="clear-cookies-btn" onClick={handleClearCookies}>
              Clear My Save ⚠️
            </button>

            <h2 className="note8">Made w/ ❤️ by <a href="https://codepen.io/Mooncaque" target="_blank">Nisal Herath</a></h2> 

          </div>
        </div>
        </div>
      )}

      {showClearCookiesAlert && ( // Render clear cookies alert when showClearCookiesAlert is true
        <div className="alert1-backdrop">
          <div className="alert2">
            <h2 id="sure">Are you sure you want to clear your saved data?</h2>
            <h2 className="note6">This action will clear your nickname and highscore from the server.</h2>
            <h2 className="note5">Means you have to Register <em><b>Again!</b></em></h2>
            <div>
              <button id="yesbtn"onClick={clearCookies}>Yes</button>
              <button onClick={cancelClearCookies}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showWelcomeAlert && !isLoggedIn && imagesLoaded && (
        <div className="alert3-backdrop">
          <div className="alert3">
          
            <h2 id="nicknameTitle">Welcome Awesome People</h2>
            <h2 className="note10">Win the Grand prize by competing in this mini-game.</h2>
            <button onClick={() => setShowWelcomeAlert(false)} className="letsgo">Let's Go!</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;