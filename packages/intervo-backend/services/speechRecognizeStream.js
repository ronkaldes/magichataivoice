const createGoogleSpeechRecognizeStream = require('./createGoogleSpeechRecognizeStream');
const createAzureSpeechRecognizeStream = require('./createAzureSpeechRecognizeStream');
const createAssemblyAIRecognizeStream = require('./createAssemblyAIRecognizeStream');
const createDeepgramRecognizeStream = require('./createDeepgramRecognizeStream');
const constants = require('../lib/constants');
// Note: The create functions (Google, Azure, AssemblyAI) now need to be async
// because AssemblyAI's setup involves an async connect() call.
// The calling code in twilioHandler already uses await when creating the stream,
// so this change should be compatible.
async function createSpeechRecognizeStream(config, params) {
  /*common logic here */
  const {interactionSettings} = config.agent;
  const responseThreshold = interactionSettings?.responseThreshold || 0.5;
  const { STT_ENDPOINTING_HIGH_MS, STT_ENDPOINTING_LOW_MS } = constants;

  const endPointingMs = STT_ENDPOINTING_LOW_MS + (STT_ENDPOINTING_HIGH_MS - STT_ENDPOINTING_LOW_MS) * responseThreshold;


  console.log("endPointingMs",interactionSettings, STT_ENDPOINTING_LOW_MS, STT_ENDPOINTING_HIGH_MS, endPointingMs);
  console.log("Selecting STT Service:", config.sttService?.toLowerCase());
  switch (config.sttService?.toLowerCase()) {
    case 'azure speech services':
      // Assuming createAzureSpeechRecognizeStream is also async or returns a promise
      return await createAzureSpeechRecognizeStream({...params, endPointingMs});
    case 'assembly ai':
    case 'assemblyai': // Add alias for flexibility
      // createAssemblyAIRecognizeStream is now async
      return await createAssemblyAIRecognizeStream({...params, endPointingMs});
    case 'deepgram':
      return await createDeepgramRecognizeStream({...params, endPointingMs});
    case 'google':
    default:
      console.log("Defaulting to Google STT Service");
      // Assuming createGoogleSpeechRecognizeStream is NOT async, but awaiting it is safe.
      return await createGoogleSpeechRecognizeStream({...params, endPointingMs});
  }
}

module.exports = createSpeechRecognizeStream;

