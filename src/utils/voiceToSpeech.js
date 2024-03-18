export function startSpeechRecog(
  setToggleFlag,
  setOutput,
  setRecognition,
  setText,
  startButton
) {
  if ("webkitSpeechRecognition" in window) {
    setToggleFlag(false);
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = function () {};

    recognition.onresult = function (event) {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setOutput(event.results[i][0].transcript);
          setText(event.results[i][0].transcript);
          startButton();
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = function () {};

    recognition.start();
    setRecognition(recognition);
  } else {
    console.error("Web Speech API not supported");
  }
}

export function stopSpeechRecog(recognition, setToggleFlag) {
  console.log("i ran");

  if (recognition) {
    recognition.stop();
    setToggleFlag(true); // Reset toggle flag when stopping recognition
  }
}
