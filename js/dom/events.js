import elements from './elements.js';
import settingsManager from '../settings/settings-manager.js';
const fs = require('fs').promises;
const path = require('path');

/**
 * Updates UI to show disconnect button and hide connect button
 */
const showDisconnectButton = () => {
  elements.connectBtn.style.display = 'none';
  elements.disconnectBtn.style.display = 'block';
};

/**
 * Updates UI to show connect button and hide disconnect button
 */
const showConnectButton = () => {
  elements.disconnectBtn.style.display = 'none';
  elements.connectBtn.style.display = 'block';
};

let isCameraActive = false;

/**
 * Ensures the agent is connected and initialized
 * @param {GeminiAgent} agent - The main application agent instance
 * @returns {Promise<void>}
 */
const ensureAgentReady = async (agent) => {
  if (!agent.connected) {
    await agent.connect();
    showDisconnectButton();
  }
  if (!agent.initialized) {
    await agent.initialize();
  }
};

/**
 * Sets up event listeners for the application's UI elements
 * @param {GeminiAgent} agent - The main application agent instance
 */
export function setupEventListeners(agent) {
  // Disconnect handler
  elements.disconnectBtn.addEventListener('click', async () => {
    try {
      await agent.disconnect();
      showConnectButton();
      [elements.cameraBtn, elements.screenBtn, elements.micBtn].forEach(btn => btn.classList.remove('active'));
      isCameraActive = false;
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  });

  // Connect handler
  elements.connectBtn.addEventListener('click', async () => {
    try {
      await ensureAgentReady(agent);
    } catch (error) {
      console.error('Error connecting:', error);
    }
  });

  // Microphone toggle handler
  elements.micBtn.addEventListener('click', async () => {
    try {
      await ensureAgentReady(agent);
      await agent.toggleMic();
      elements.micBtn.classList.toggle('active');
    } catch (error) {
      console.error('Error toggling microphone:', error);
      elements.micBtn.classList.remove('active');
    }
  });

  // Camera toggle handler
  elements.cameraBtn.addEventListener('click', async () => {
    try {
      await ensureAgentReady(agent);

      if (!isCameraActive) {
        await agent.startCameraCapture();
        elements.cameraBtn.classList.add('active');
      } else {
        await agent.stopCameraCapture();
        elements.cameraBtn.classList.remove('active');
      }
      isCameraActive = !isCameraActive;
    } catch (error) {
      console.error('Error toggling camera:', error);
      elements.cameraBtn.classList.remove('active');
      isCameraActive = false;
    }
  });

  // Screen sharing handler
  let isScreenShareActive = false;

  // Listen for screen share stopped events (from native browser controls)
  agent.on('screenshare_stopped', () => {
    elements.screenBtn.classList.remove('active');
    isScreenShareActive = false;
    console.info('Screen share stopped');
  });

  elements.screenBtn.addEventListener('click', async () => {
    try {
      await ensureAgentReady(agent);

      if (!isScreenShareActive) {
        await agent.startScreenShare();
        elements.screenBtn.classList.add('active');
      } else {
        await agent.stopScreenShare();
        elements.screenBtn.classList.remove('active');
      }
      isScreenShareActive = !isScreenShareActive;
    } catch (error) {
      console.error('Error toggling screen share:', error);
      elements.screenBtn.classList.remove('active');
      isScreenShareActive = false;
    }
  });

  // Message sending handlers
  const sendMessage = async () => {
    try {
      await ensureAgentReady(agent);
      const text = elements.messageInput.value.trim();


      /*** AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA ***/
      // Read all files in the directory
      const dir = "./screenshots";
      const files = await fs.readdir(dir);

      // Filter for files matching "screenshot_{timestamp}"
      // This regex assumes the file name starts with "screenshot_" followed by one or more digits.
      const screenshotFiles = files.filter(file => /^screenshot_\d+/.test(file));

      if (screenshotFiles.length === 0) {
        console.log('No screenshot files found');
      }

      // Sort the files by their numeric timestamp in descending order (latest first)
      screenshotFiles.sort((a, b) => {
        // Extract the timestamp using regex
        const timestampA = parseInt(a.match(/^screenshot_(\d+)/)[1], 10);
        const timestampB = parseInt(b.match(/^screenshot_(\d+)/)[1], 10);
        return timestampB - timestampA;
      });

      // The first file in the sorted list is the latest
      const latestFile = screenshotFiles[0];
      const filePathLatest = path.join(dir, latestFile);

      // Read the file into a buffer
      const fileBuffer = await fs.readFile(filePathLatest);

      // Convert the buffer to a Base64-encoded string
      const base64String = fileBuffer.toString('base64');


      /*** AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA ***/

      // Read all files in the given directory
      const sessionDir = "./";
      const filesSession = await fs.readdir(sessionDir);

      // Filter for files that start with "session_analysis_" and end with ".json"
      const sessionFiles = filesSession.filter(
        (file) => file.startsWith('session_analysis_') && file.endsWith('.json')
      );

      if (sessionFiles.length === 0) {
        throw new Error('No session analysis files found in the directory.');
      }

      // Map each file to its full path
      const fullPaths = sessionFiles.map((file) => path.join(sessionDir, file));

      // Get stats (including modification time) for each file
      const filesWithStats = await Promise.all(
        fullPaths.map(async (file) => {
          const stats = await fs.stat(file);
          return { file, mtime: stats.mtime };
        })
      );

      // Sort the files by modification time in descending order (latest first)
      filesWithStats.sort((a, b) => b.mtime - a.mtime);

      // The first element is the latest file
      const latestFilePath = filesWithStats[0].file;
      console.log('Latest file:', latestFilePath);

      // Read the latest file's content
      const fileContent = await fs.readFile(latestFilePath, 'utf8');

      // Parse the JSON content
      const sessionAnalysis = JSON.parse(fileContent);
      /*** BBBBBBBBBBBBBBBBBBBBBBBBBBBBB ***/

      // const filePath = './screenshots/screenshot_2025-02-08_12-29-46.png';
      // const imageBuffer = await fs.readFile(filePath);
      // // Convert the buffer to a base64 string
      // const base64image = imageBuffer.toString('base64');
      //
      // // Await your sendImage function if it's asynchronous
      // // await agent.sendImage(base64image);
      console.log("SENDING")
      console.log(`filePathLatest: ${filePathLatest}`)
      // const message = text?.length > 0 ? text : 'Describe the image that I just sent you. There should be a red dot in the image. In which position of the screen it is?';
      const message = `This is the left ratio: ${sessionAnalysis.left_ratio}, and this is the right ratio: ${sessionAnalysis.right_ratio}. If the left ratio is higher, please Tell me I am losing focus and I need to get back to work. But if right ratio is higher, please give me some compliment
PLEASE JUST SAY THE THING. NO NEED  TO REPEAT THE INFORMATION THAT I JUST GAVE YOU`;
      await agent.sendTextAndImage(message, base64String);
      elements.messageInput.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  elements.sendBtn.addEventListener('click', sendMessage);
  elements.messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });


  // New: Automatically call sendMessage() every 5 seconds.
  // Note: Since there's no event object here, you don't need to call event.preventDefault().
  setInterval(async () => {
    try {
      // Simply call sendMessage every 5000 milliseconds (5 seconds)
      await sendMessage();
    } catch (error) {
      console.error('Error in automatic message sending:', error);
    }
  }, 45000);

  // Settings button click
  elements.settingsBtn.addEventListener('click', () => settingsManager.show());
}

// Initialize settings
settingsManager;
