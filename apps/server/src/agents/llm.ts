import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import env from "../config.js";

/**
 * Deterministic offline mock model for offline tests or when GEMINI_API_KEY is not configured.
 */
class OfflineMockChatModel extends BaseChatModel {
  constructor() {
    super({});
  }

  _llmType(): string {
    return "offline_mock";
  }

  async _generate(
    messages: BaseMessage[]
  ): Promise<{ generations: Array<{ text: string; message: AIMessage }> }> {
    const lastMsg = messages[messages.length - 1];
    const content = typeof lastMsg?.content === "string" ? lastMsg.content : "";

    const text = `Plan summary synthesized for ${content.slice(0, 50)}`;
    const message = new AIMessage({ content: text });
    return {
      generations: [{ text, message }],
    };
  }
}

/**
 * Returns a configured chat model.
 * Uses Gemini when GEMINI_API_KEY is set in environment; otherwise returns OfflineMockChatModel.
 */
export function getChatModel(): BaseChatModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    return new ChatGoogleGenerativeAI({
      apiKey,
      model: modelName,
      temperature: 0.2,
    });
  }

  return new OfflineMockChatModel();
}
