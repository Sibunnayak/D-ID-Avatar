import axios from "axios";
const username = "bmV4YXkzMDc5NEBpcm5pbmkuY29t";
const password = "q602vgj7q3PKtLFggelVm";
const credentials = btoa(username + ":" + password);
const basicAuth = "Basic " + credentials;
// All Variables
let CHAT_ID;
let AGENT_ID;
let AllAgents;
let Agent;
let Stream;
let source_url =
  "https://create-images-results.d-id.com/DefaultPresenters/Zivva_f/v1_image.png";

//API to get agent id and chat id
AGENT_ID = "agt_TKvm4srp";
CHAT_ID = "cht_lKCxptzYJ3vlmepfuIOyK";
// Gets all Agents
export const getAllAgents = () => {
  axios
    .get("https://api.d-id.com/agents/me", {
      headers: { Authorization: basicAuth },
    })
    .then(function (response) {
      console.log("Got All Agent list");
      AllAgents = response.data.agents;
      AllAgents.forEach((agent) => {
        const res = {
          id: agent.id,
          preview_Img: agent.preview_thumbnail,
          idle_video: agent.idle_video,
          knowledge: agent.knowledge,
        };
        if (res.preview_Img) {
          console.log(res);
        }
        return;
      });
    })
    .catch(function (error) {
      console.log("Error on Authentication", error);
    });
};

// Gets Single Agent
export const getAgent = () => {
  axios
    .get("https://api.d-id.com/agents/agt_TKvm4srp", {
      headers: { Authorization: basicAuth },
    })
    .then(function (response) {
      console.log("Single Agent");
      Agent = response.data;
      console.log(Agent);
    })
    .catch(function (error) {
      console.log("Error on Authentication", error);
    });
};

//Validate Agent and Chat
export const validateAgentChatIds = (playIdleVideo) => {
  playIdleVideo();
  if (
    AGENT_ID === "" ||
    AGENT_ID === undefined ||
    CHAT_ID === "" ||
    CHAT_ID === undefined
  ) {
    console.log("Empty 'agentID' and 'chatID' ");
  } else {
    console.log("You are good to go!");
  }
};
export const playIdleVideo = (setVideo) => {
  setVideo();
  console.log("playing idle video");
};
