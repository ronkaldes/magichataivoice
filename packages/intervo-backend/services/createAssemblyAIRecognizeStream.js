const { AssemblyAI } = require('assemblyai');
const WebSocket = require('ws');

const assembly_api_key = process.env.ASSEMBLYAI_API_KEY;
const SAMPLE_RATE = 8000; // Sample rate expected by Twilio Media Streams (MULAW)

// Function to create and manage the AssemblyAI real-time stream
async function createAssemblyAIRecognizeStream({
  timer,
  ws, // The specific WebSocket connection for this call
  wss, // The WebSocket server instance (for broadcasting to UI clients)
  ignoreNewTranscriptions, // Flag to ignore new transcriptions while processing
  isProcessingTTS, // Flag indicating TTS is currently active
  processTranscription, // Callback function from twilioHandler to process final transcription
  resetInactivityTimeout, // Callback function from twilioHandler to reset inactivity timer
  inactivityTimeout, // The current inactivity timeout ID
  endPointingMs // New parameter for AssemblyAI silence threshold
}) {
  if (!assembly_api_key) {
    console.error(`[${timer()}] AssemblyAI API Key not found. Please set ASSEMBLYAI_API_KEY environment variable.`);
    // Return a dummy stream object to avoid crashes downstream
    return {
      write: () => {},
      end: () => { console.log(`[${timer()}] AssemblyAI stream ended (no API key).`); }
    };
  }

  const client = new AssemblyAI({ apiKey: assembly_api_key });
  let transcriber;
  let isReady = false; // <-- Add state flag
  let isPaused = false; // <-- Add pause flag

  // Wrap the connection and setup in a Promise
  return new Promise(async (resolve, reject) => {
    try {
      transcriber = client.realtime.transcriber({
        sampleRate: SAMPLE_RATE,
        encoding: 'pcm_mulaw', // Ensure encoding matches Twilio's output
        endUtteranceSilenceThreshold: endPointingMs !== undefined ? endPointingMs : 700 // Use passed value or default to 700ms
      });

      // --- Promise Resolution/Rejection Logic --- 
      let isOpen = false;

      // Resolve the promise once the connection is open
      transcriber.on('open', ({ sessionId }) => {
        console.log(`[${timer()}] AssemblyAI connection established. Session ID: ${sessionId}`);
        console.log(`[${timer()}] Status in 'open' event handler: ${transcriber?.status}`); // Log status here
        isReady = true; // <-- Set flag to true
        isOpen = true;
        // Return the stream interface object when connection is ready
        resolve({
          write: (chunk) => {
            // Check the flag, paused status, and if transcriber still exists
            if (isReady && transcriber && !isPaused) { 
                // Optional: Log status if needed for debugging, but rely on isReady
                 if (transcriber.status !== 'connected') {
                     console.warn(`[${timer()}] --- Writing to AssemblyAI when status is: ${transcriber.status} (but isReady=true) ---`);
                 }
              // console.log(`[${timer()}] --- Sending audio chunk to AssemblyAI (Size: ${chunk.length}) ---`);
              transcriber.sendAudio(chunk);
            } else {
              // Log why write failed
              let reason = `isReady: ${isReady}, transcriber exists: ${!!transcriber}, isPaused: ${isPaused}, status: ${transcriber?.status}`;
              if(isPaused) reason = "Stream is paused."; // More specific reason
              console.warn(`[${timer()}] --- Attempted write to AssemblyAI failed. ${reason} ---`);
            }
          },
          end: async () => {
            console.log(`[${timer()}] --- Attempting to end AssemblyAI stream (setting isReady=false) ---`);
            isReady = false; // <-- Set flag to false on end
            if (transcriber) { // Check if transcriber exists
              // Check status before closing, or just attempt close
               if (transcriber.status === 'connected' || transcriber.status === 'connecting') { 
                 await transcriber.close();
                 console.log(`[${timer()}] AssemblyAI stream closed successfully.`);
               } else {
                 console.log(`[${timer()}] AssemblyAI stream already closed or not in a closable state (${transcriber.status}).`);
               }
              transcriber = null; // Clean up reference
              console.log(`[${timer()}] --- Transcriber set to null ---`);
            } else {
                 console.log(`[${timer()}] AssemblyAI stream end called, but transcriber was null.`);
            }
          },
          pause: () => {
            console.log(`[${timer()}] --- AssemblyAI Stream Paused ---`);
            isPaused = true;
          },
          resume: () => {
            console.log(`[${timer()}] --- AssemblyAI Stream Resumed ---`);
            isPaused = false;
          }
        });
      });

      // Event listener for receiving transcripts
      transcriber.on('transcript', async (transcript) => {
        console.log(`[${timer()}] --- AssemblyAI Transcript Event Received ---`, transcript);
        // Use transcript.message_type === 'PartialTranscript' or 'FinalTranscript'
        if (ignoreNewTranscriptions || isProcessingTTS || !transcript.text) {
          // console.log(`[${timer()}] Ignoring AssemblyAI transcript (processing other task or empty)`);
          return;
        }

        const transcription = transcript.text;
        const isFinal = transcript.message_type === 'FinalTranscript';

        console.log(`[${timer()}] AssemblyAI Transcript (${transcript.message_type}): ${transcription}`);

        // Broadcast transcription (partial and final) to UI clients (agent dashboard)
        // wss.clients.forEach((client) => {
        //   // Check if the client is the agent dashboard and not the Twilio connection itself
        //   if (client.readyState === WebSocket.OPEN && client !== ws) {
        //      // Assuming your UI differentiates based on 'source' or similar
        //      client.send(JSON.stringify({ event: "transcription", source: "user", text: transcription }));
        //   }
        // });


        if (isFinal) {
           console.log(`[${timer()}] AssemblyAI Final Transcript received: \"${transcription}\"`);
           
           // --- Move broadcasting inside the isFinal block ---
           wss.clients.forEach((client) => {
             // Check if the client is the agent dashboard and not the Twilio connection itself
             if (client.readyState === WebSocket.OPEN && client !== ws) {
                // Assuming your UI differentiates based on 'source' or similar
                client.send(JSON.stringify({ event: "transcription", source: "user", text: transcription }));
             }
           });
           // -----------------------------------------------------

          clearTimeout(inactivityTimeout); // Clear any pending inactivity timeout
          // Call the main processing function from twilioHandler
          await processTranscription(transcription);
          // Note: AssemblyAI might send multiple 'FinalTranscript' for segments of an utterance.
          // The twilioHandler's logic should ideally handle potentially frequent final transcriptions.
          // Resetting inactivity timer here might be needed if we expect more speech shortly after a final segment.
          // resetInactivityTimeout(transcription); // <-- Remove this. Rely on endUtteranceSilenceThreshold.
        } else {
          // It's a partial transcript, DO NOTHING except potentially log
          console.log(`[${timer()}] Ignoring partial transcript: "${transcription}"`);
        }
      });

      // Reject the promise if an error occurs *before* opening
      transcriber.on('error', (error) => {
        console.error(`[${timer()}] --- AssemblyAI Error Event Received ---:`, error);
        if (!isOpen) {
          console.error(`[${timer()}] AssemblyAI error before connection opened. Rejecting promise.`);
          reject(error); 
        }
        // If already open, the stream interface is already returned,
        // we just log the error here. Error handling within the stream usage might be needed.
      });

      // Reject the promise if the connection closes *before* opening
      transcriber.on('close', (code, reason) => {
        console.log(`[${timer()}] AssemblyAI connection closed: Code ${code}, Reason: ${reason}`);
        if (!isOpen) {
          console.error(`[${timer()}] AssemblyAI connection closed before opening. Rejecting promise.`);
          reject(new Error(`AssemblyAI connection closed before opening: ${code} ${reason}`));
        }
         // If already open, the 'end' method handles cleanup.
      });

      // Initiate the connection
      await transcriber.connect();
      console.log(`[${timer()}] AssemblyAI transcriber connection initiated. Waiting for 'open' event...`);

    } catch (error) {
      console.error(`[${timer()}] Failed to create or connect AssemblyAI transcriber:`, error);
      // Reject the promise if initial setup fails
      reject(error);
    }
  }); // End of Promise constructor
}

// Export the async function directly
module.exports = createAssemblyAIRecognizeStream;
