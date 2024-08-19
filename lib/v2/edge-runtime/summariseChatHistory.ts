import { ChatGPTMessage } from "../../models";
import { exponentialRetryWrapper } from "../../utils";
import { getLLMResponse } from "../../queryLLM";
import {
  chatHistorySummaryPrompt,
  summariseChatHistoryLLMParams,
} from "../prompts/summariseChatHistory";

export async function summariseChatHistory(
  chatHistory: ChatGPTMessage[],
  language: string | null,
  org: {
    id: number;
    name: string;
    description: string;
    matching_step_model: string;
  },
): Promise<string> {
  const { prompt, numPastMessagesIncluded, pastConvTokenCount } =
    chatHistorySummaryPrompt(chatHistory, org, language);
  console.log("Prompt for summariseChatHistory: ", prompt[0].content);
  const use4 = numPastMessagesIncluded >= 5 || pastConvTokenCount > 100;
  const modelToUseForSummary = use4
    ? // ? "anthropic/claude-3-5-sonnet-20240620"
      // : "anthropic/claude-3-haiku-20240307";
      "gpt-4"
    : "gpt-4-0125-preview";

  // // claude models need at least one message object but for summarization so modifying the prompt accordingly
  // let nonSystemMessages = prompt.filter(p => p.role !== "system");
  // if(nonSystemMessages.length === 0 && modelToUseForSummary.includes("anthropic")){
  //   prompt.push({role: "user", content: chatHistory[chatHistory.length - 1].content});
  // }
  // //

  let out: string = await exponentialRetryWrapper(
    getLLMResponse,
    [prompt, summariseChatHistoryLLMParams, modelToUseForSummary],
    3,
  );
  console.log("Summarised user request:", out);
  if (!out) {
    // Using anthropic/claude-3-haiku-20240307 instead of gpt-3.5-turbo
    out = await exponentialRetryWrapper(
      getLLMResponse,
      [
        prompt,
        summariseChatHistoryLLMParams,
        true ? "anthropic/claude-3-haiku-20240307" : "gpt-3.5-turbo-0125",
      ],
      3,
    );
  }
  return out;
}
