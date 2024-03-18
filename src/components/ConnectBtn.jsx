import React, { useEffect } from "react";

const ConnectBtn = () => {
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check if the key pressed is 'z' and the previous key pressed was 'p'
      if (event.key === "p") {
        console.log('You pressed "z" followed by "p"');
        // Call your function here
        // functionName();
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    // Clean up the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []); // Empty dependency array means this effect runs once after initial render

  return <div>Press 'z' followed by 'p'</div>;
};

export default ConnectBtn;
