import React, { useEffect, useRef, useState } from "react";
// import { startSpeechRecog, stopSpeechRecog } from "./utils/voiceToSpeech";
import DID_API from "./data.json";
import "./App.css";
function App() {
  //Binding RTC
  const RTCPeerConnection = (
    window.RTCPeerConnection ||
    window.webkitRTCPeerConnection ||
    window.mozRTCPeerConnection
  ).bind(window);
  //Variables
  let peerConnection;
  let streamId;
  let sessionId;
  let chatId;
  let sessionClientAnswer;
  let statsIntervalId;
  let videoIsPlaying;
  let lastBytesReceived;
  let agentId;
  //API to get agent id and chat id
  agentId = "agt_CziCBN3y";
  chatId = "cht_E1x3nMKTnRiBXBUo6OQfZ";

  //Variables END
  const videoRef = useRef(null);
  const [output, setOutput] = useState("");
  const [toggleFlag, setToggleFlag] = useState(true);
  const [recognition, setRecognition] = useState(null);
  const [streamTracks, setStreamTracks] = useState([]);
  const [currStreamId, setCurrStreamId] = useState("");
  const [currSessionId, setCurrSessionId] = useState("");
  const [dataChannel, setDataChannel] = useState(false);
  const [video, setVideo] = useState();
  const [status, setStatus] = useState("Disconnected");
  const [text, setText] = useState("");
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true });
    validateAgentChatIds();
  }, []);
  //Speach
  function startSpeechRecog() {
    if ("webkitSpeechRecognition" in window) {
      setToggleFlag(false);
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = function () {
        console.log("mic on");
      };

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

      recognition.onend = function () {
        console.log("mic off");
        recognition.start(); //Restarts Mic if its turned off
      };

      recognition.start();
      setRecognition(recognition);
    } else {
      console.error("Web Speech API not supported");
    }
  }

  function stopSpeechRecog(recognition, setToggleFlag) {
    console.log("i ran");

    if (recognition) {
      recognition.stop();
      setToggleFlag(true); // Reset toggle flag when stopping recognition
    }
  }

  //Idle video play
  const playIdleVideo = async () => {
    videoRef.current.srcObject = undefined;
    videoRef.current.autoPlay = true;
    videoRef.current.src = await "emma.mp4";
    videoRef.current.loop = true;
    console.log(videoRef.current);
    console.log("playing idle video");
  };

  //Validate Agent and Chat
  const validateAgentChatIds = () => {
    playIdleVideo();
    if (
      agentId === "" ||
      agentId === undefined ||
      chatId === "" ||
      chatId === undefined
    ) {
      console.log("Empty 'agentID' and 'chatID' ");
    } else {
      console.log("You are good to go!");
    }
  };

  //Stream Creation
  const createPeerConnection = async (offer, iceServers) => {
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({ iceServers });
      peerConnection.addEventListener(
        "icegatheringstatechange",
        onIceGatheringStateChange,
        true
      );
      peerConnection.addEventListener("icecandidate", onIceCandidate, true);
      peerConnection.addEventListener(
        "iceconnectionstatechange",
        onIceConnectionStateChange,
        true
      );
      peerConnection.addEventListener(
        "connectionstatechange",
        onConnectionStateChange,
        true
      );
      peerConnection.addEventListener(
        "signalingstatechange",
        onSignalingStateChange,
        true
      );
      peerConnection.addEventListener("track", onTrack, true);
    }
    await peerConnection.setRemoteDescription(offer); //working
    console.log("set remote sdp OK");
    setStatus("set remote sdp OK");

    const sessionClientAnswer = await peerConnection.createAnswer();
    console.log("create local sdp OK");
    setStatus("create local sdp OK");

    await peerConnection.setLocalDescription(sessionClientAnswer);
    console.log("set local sdp OK");
    setStatus("set local sdp OK");
    // Data Channel creation (for dispalying the Agent's responses as text)
    let dc = await peerConnection.createDataChannel("JanusDataChannel");
    dc.onopen = () => {
      console.log("datachannel open");
      setDataChannel(true);
      setStatus("(Ready)");
    };
    let decodedMsg;
    // Agent Text Responses - Decoding the responses, pasting to the HTML element
    dc.onmessage = (event) => {
      let msg = event.data;
      let msgType = "chat/answer:";
      // console.log("message", msg);
      if (msg.includes(msgType)) {
        msg = decodeURIComponent(msg.replace(msgType, ""));
        decodedMsg = msg;
        return decodedMsg;
      }
      if (msg.includes("stream/started")) {
        console.log(msg);
      } else {
        console.log(msg);
      }
    };
    dc.onclose = () => {
      console.log("datachannel close");
      setDataChannel(false);
      setStatus("Disconnected");
    };
    return sessionClientAnswer;
  };
  //Peer connection End
  //Peer connection depended funtions
  function onIceGatheringStateChange() {
    console.log("onIceGatheringStateChange");
  }
  function onIceCandidate(event) {
    if (event.candidate) {
      const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

      // WEBRTC API CALL 3 - Submit network information
      fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidate,
          sdpMid,
          sdpMLineIndex,
          session_id: sessionId,
        }),
      });
    }
  }
  function onIceConnectionStateChange() {
    // console.log(
    //   "onIceConnectionStateChange",
    //   peerConnection.iceConnectionState
    // );

    if (
      peerConnection.iceConnectionState === "failed" ||
      peerConnection.iceConnectionState === "closed"
    ) {
      stopAllStreams();
      closePC();
    }
  }
  function onConnectionStateChange() {
    // not supported in firefox
    console.log("peerConnectionState-", peerConnection.connectionState);
  }
  function onSignalingStateChange() {
    console.log("signalingState-", peerConnection.signalingState);
  }
  function onVideoStatusChange(videoIsPlaying, stream) {
    let status;
    if (videoIsPlaying) {
      status = "streaming";
      const remoteStream = stream;
      console.log("Remote", remoteStream);
      setVideoElement(remoteStream);
    } else {
      status = "empty";
      playIdleVideo();
    }
    // setVideoStatus("streaming");
    console.log("streamingState-", status);
  }
  function onTrack(event) {
    /**
     * The following code is designed to provide information about wether currently there is data
     * that's being streamed - It does so by periodically looking for changes in total stream data size
     *
     * This information in our case is used in order to show idle video while no video is streaming.
     * To create this idle video use the POST https://api.d-id.com/talks (or clips) endpoint with a silent audio file or a text script with only ssml breaks
     * https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#break-tag
     * for seamless results use `config.fluent: true` and provide the same configuration as the streaming video
     */

    if (!event.track) return;

    statsIntervalId = setInterval(async () => {
      let stats;
      try {
        stats = await peerConnection.getStats(event.track);
      } catch (error) {}
      stats.forEach((report) => {
        if (report.type === "inbound-rtp" && report.mediaType === "video") {
          const videoStatusChanged =
            videoIsPlaying !== report.bytesReceived > lastBytesReceived;

          if (videoStatusChanged) {
            videoIsPlaying = report.bytesReceived > lastBytesReceived;
            onVideoStatusChange(videoIsPlaying, event.streams[0]);
          }
          lastBytesReceived = report.bytesReceived;
        }
      });
    }, 500);
  }
  function setVideoElement(stream) {
    if (!stream) return;
    videoRef.current.classList.add("animated");
    setVideo(stream);
    console.log(stream.getTracks()[1]);
    setStreamTracks(stream.getTracks()[1]);
    videoRef.current.srcObject = stream;
  }
  function stopAllStreams() {
    if (videoRef.current.srcObject) {
      console.log("stopping video streams");
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }

  function closePC(pc = peerConnection) {
    if (!pc) return;
    console.log("stopping peer connection");
    pc.close();
    pc.removeEventListener(
      "icegatheringstatechange",
      onIceGatheringStateChange,
      true
    );
    pc.removeEventListener("icecandidate", onIceCandidate, true);
    pc.removeEventListener(
      "iceconnectionstatechange",
      onIceConnectionStateChange,
      true
    );
    pc.removeEventListener(
      "connectionstatechange",
      onConnectionStateChange,
      true
    );
    pc.removeEventListener(
      "signalingstatechange",
      onSignalingStateChange,
      true
    );
    pc.removeEventListener("track", onTrack, true);
    clearInterval(statsIntervalId);
    console.log("stopped peer connection");
    if (pc === peerConnection) {
      peerConnection = null;
    }
  }
  const maxRetryCount = 3;
  const maxDelaySec = 4;
  async function fetchWithRetries(url, options, retries = 1) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (retries <= maxRetryCount) {
        const delay =
          Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) *
          1000;

        await new Promise((resolve) => setTimeout(resolve, delay));

        console.log(
          `Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`
        );
        return fetchWithRetries(url, options, retries + 1);
      } else {
        throw new Error(`Max retries exceeded. error: ${err}`);
      }
    }
  }
  //Start Button
  // const startButton = document.getElementById("start-button");
  const startButton = async () => {
    console.log("startButton--------------------------------");
    // connectionState not supported in firefox

    console.log(peerConnection);

    // Agents Overview - Step 3: Send a Message to a Chat session - Send a message to a Chat
    console.log("streamId", currStreamId);
    console.log("sessionid", currSessionId);
    console.log("text:", text);
    const playResponse = await fetchWithRetries(
      `${DID_API.url}/agents/${agentId}/chat/${chatId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          streamId: currStreamId,
          sessionId: currSessionId,
          messages: [
            {
              role: "user",
              content: text,
              created_at: new Date().toString(),
            },
          ],
        }),
      }
    );
    setText("");
  };

  // const connectButton = document.getElementById('connect-button');
  const connectButton = async () => {
    setStatus("Connecting");
    if (agentId == "" || agentId === undefined) {
      return alert(
        "1. Click on the 'Create new Agent with Knowledge' button\n2. Open the Console and wait for the process to complete\n3. Press on the 'Connect' button\n4. Type and send a message to the chat\nNOTE: You can store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats"
      );
    }

    if (peerConnection && peerConnection.connectionState === "connected") {
      return;
    }
    stopAllStreams();
    closePC();

    // WEBRTC API CALL 1 - Create a new stream
    const sessionResponse = await fetchWithRetries(
      `${DID_API.url}/${DID_API.service}/streams`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_url:
            "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg",
        }),
      }
    );

    const {
      id: newStreamId,
      offer,
      ice_servers: iceServers,
      session_id: newSessionId,
    } = await sessionResponse.json();
    streamId = newStreamId;
    sessionId = newSessionId;
    setCurrSessionId(newSessionId);
    setCurrStreamId(newStreamId);
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      console.log("error during streaming setup", e);
      stopAllStreams();
      closePC();
      return;
    }

    // WEBRTC API CALL 2 - Start a stream
    const sdpResponse = await fetch(
      `${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: sessionClientAnswer,
          session_id: sessionId,
        }),
      }
    );
  };

  //Destroy Button
  // const destroyButton = document.getElementById("destroy-button");
  const destroyButton = async () => {
    await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    stopAllStreams();
    closePC();
  };

  //Stream End
  return (
    <>
      <div
        className="speaker"
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "13rem",
          boxShadow: "0 0 13px #0000003d",
          borderRadius: "5px",
        }}
      ></div>
      <div className="videocontaier ">
        <video
          className="video-element animated"
          ref={videoRef}
          autoPlay
          loop
        />
        {/* <video src="emma_idle.mp4" /> */}
        <div className="status mirror-effect">
          {" "}
          <label>Status :{status}</label>
        </div>
      </div>
      {/* <video className="video-element" ref={videoRef} autoPlay loop /> */}

      <div className="btn-container">
        <h3 id="output">{output}</h3>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
          type="text"
        />
        <button onClick={connectButton}>Connect</button>
        <button onClick={startButton}>start</button>
        {toggleFlag ? (
          <button
            onClick={startSpeechRecog}
            id="speechButton"
            style={{ border: "transparent", padding: "0 0.5rem" }}
          >
            Mic
          </button>
        ) : (
          <button
            onClick={() => stopSpeechRecog(recognition, setToggleFlag)}
            id="speechButton"
            style={{ border: "transparent", padding: "0 0.5rem" }}
          >
            Stop
          </button>
        )}
      </div>
    </>
  );
}

export default App;
