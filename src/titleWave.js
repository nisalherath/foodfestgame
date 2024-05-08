function waveTitleEffect() {
    var baseText = "";
    var waveText = " Lets Play A Fun Game";
    var messageElement = document.querySelector('.nickname-message2');
    var fullText = baseText + waveText;
    var waveMessage = fullText;
    var i = 0;
    var forward = true;
  
    function updateMessage() {
        if (forward) {
            if (i < fullText.length) {
                messageElement.textContent = waveMessage.substring(0, i + 1);
                i++;
            } else {
                forward = false;
                i--;
            }
        } else {
            if (i >= baseText.length) {
                messageElement.textContent = waveMessage.substring(0, i);
                i--;
            } else {
                forward = true;
                i++;
            }
        }
    }
  
    setInterval(updateMessage, 400);
}

waveTitleEffect();
