package com.monargent.backend.service.ai;

public interface AiCompletionClient {

    String complete(String systemPrompt, String userPrompt);
}
