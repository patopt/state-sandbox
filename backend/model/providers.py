import os
from openai import AsyncOpenAI

from config import (
    AI_PROVIDER,
    OPENAI_API_KEY,
    GOOGLE_API_KEY,
    MODEL_HIGH_REASONING,
    MODEL_MEDIUM_REASONING,
    MODEL_LOW_REASONING,
    GEMINI_MODEL_HIGH,
    GEMINI_MODEL_MEDIUM,
    GEMINI_MODEL_LOW,
)


class OpenAIProvider:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def generate_medium_reasoning(self, text: str) -> str:
        response = await self.client.chat.completions.create(
            model=MODEL_MEDIUM_REASONING,
            messages=[{"role": "user", "content": text}],
            reasoning_effort="medium",
        )
        return response.choices[0].message.content

    async def generate_high_reasoning(self, text: str) -> str:
        response = await self.client.chat.completions.create(
            model=MODEL_HIGH_REASONING,
            messages=[{"role": "user", "content": text}],
            reasoning_effort="medium",
        )
        return response.choices[0].message.content

    async def generate_low_reasoning(self, text: str) -> str:
        response = await self.client.chat.completions.create(
            model=MODEL_LOW_REASONING,
            messages=[{"role": "user", "content": text}],
        )
        return response.choices[0].message.content


class GeminiProvider:
    def __init__(self):
        try:
            import google.generativeai as genai
            genai.configure(api_key=GOOGLE_API_KEY)
            self._genai = genai
        except ImportError:
            raise ImportError(
                "google-generativeai package is required for Gemini support. "
                "Install it with: pip install google-generativeai"
            )

    async def _generate(self, model_name: str, text: str) -> str:
        import asyncio
        model = self._genai.GenerativeModel(model_name)
        # Run in executor since Gemini SDK is sync
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(
                text,
                generation_config=self._genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=8192,
                ),
            ),
        )
        return response.text

    async def generate_high_reasoning(self, text: str) -> str:
        return await self._generate(GEMINI_MODEL_HIGH, text)

    async def generate_medium_reasoning(self, text: str) -> str:
        return await self._generate(GEMINI_MODEL_MEDIUM, text)

    async def generate_low_reasoning(self, text: str) -> str:
        return await self._generate(GEMINI_MODEL_LOW, text)


def get_provider(provider_name: str = None):
    """Get the AI provider based on configuration or explicit override."""
    name = provider_name or AI_PROVIDER
    if name == "gemini":
        return GeminiProvider()
    return OpenAIProvider()
