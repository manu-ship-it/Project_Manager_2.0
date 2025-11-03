# Voice Assistant Setup Guide

## Overview

The Voice Assistant feature uses OpenAI's Realtime API with WebRTC to enable real-time voice interactions. Users can create, edit, and retrieve projects using natural language commands.

## Features

- **Real-time Voice Interaction**: Speech-to-speech conversations with low latency
- **Project Management**: Create, edit, retrieve, and list projects via voice commands
- **Natural Language Processing**: Understands conversational commands and context
- **Function Calling**: Executes actions based on user requests

## Setup

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `sk-`)

### 2. Configure Environment Variable

Add to your `.env.local` file:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

For Railway deployment, add this variable in the Railway dashboard under Variables.

### 3. API Endpoint

The voice assistant uses an API endpoint at `/api/realtime/token` to securely generate ephemeral tokens. This endpoint:
- Requires `OPENAI_API_KEY` environment variable
- Generates temporary tokens for WebRTC connections
- Provides fallback option for development (not recommended for production)

## Usage

1. Click the **"Talk to Assistant"** button (purple button next to "New Project")
2. Grant microphone permissions when prompted
3. Click **"Connect & Start"** to begin
4. Speak naturally to interact with your projects

## Voice Commands Examples

- **Create Project**: "Create a new project for ABC Construction called Kitchen Renovation"
- **Get Project**: "Tell me about project 2024-001"
- **Update Project**: "Update project 2024-001 status to in progress"
- **List Projects**: "Show me all in progress projects"
- **Get Status**: "What's the status of the Kitchen Renovation project?"

## Technical Details

### WebSocket Connection

The implementation uses WebSocket to connect to OpenAI's Realtime API:
- Endpoint: `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`
- Authentication: Token passed via query parameters (browser WebSocket limitation)
- Audio Format: PCM16 at 24kHz sample rate

### Function Calling

The assistant can call these functions:
- `create_project`: Create new projects
- `update_project`: Update existing projects
- `get_project`: Retrieve project details
- `list_projects`: List projects with optional filters

### Audio Processing

- Captures audio from user's microphone
- Streams audio to OpenAI in real-time
- Receives and plays back AI responses
- Supports real-time transcription

## Troubleshooting

### Connection Issues

1. **"Failed to create token"**
   - Check that `OPENAI_API_KEY` is set correctly
   - Verify API key is valid and has sufficient credits
   - Check server logs for detailed error messages

2. **"Connection error occurred"**
   - Ensure API key has access to Realtime API (may require beta access)
   - Check network connectivity
   - Try enabling fallback mode (development only): Set `NEXT_PUBLIC_USE_API_KEY_FALLBACK=true`

3. **"Failed to access microphone"**
   - Grant microphone permissions in browser settings
   - Ensure HTTPS (required for microphone access in production)
   - Check browser console for permission errors

### API Limitations

- Realtime API may require beta access - check OpenAI documentation
- Audio streaming requires stable network connection
- Function calling may have rate limits depending on your OpenAI plan

## Security Notes

- Never commit `OPENAI_API_KEY` to version control
- Ephemeral tokens expire after 1 hour
- Production deployments should use ephemeral tokens (not API key fallback)
- Voice conversations are processed by OpenAI - review their privacy policy

## Cost Considerations

OpenAI Realtime API pricing:
- Check current pricing at [OpenAI Pricing](https://openai.com/api/pricing/)
- Usage depends on audio duration and function calls
- Consider implementing usage limits for production deployments

## Future Enhancements

Potential improvements:
- Add conversation history persistence
- Implement usage analytics
- Add more granular project operations (tasks, materials, etc.)
- Support for multiple languages
- Voice activity detection (VAD) for better UX

## References

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime-webrtc)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

