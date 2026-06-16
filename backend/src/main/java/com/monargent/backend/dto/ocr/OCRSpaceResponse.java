package com.monargent.backend.dto.ocr;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import lombok.Data;
import java.util.List;

@Data
public class OCRSpaceResponse {
    @JsonProperty("ParsedResults")
    private List<ParsedResult> parsedResults;

    @JsonProperty("OCRExitCode")
    private Integer ocrExitCode;

    @JsonProperty("ErrorMessage")
    private JsonNode errorMessageNode;

    @JsonIgnore
    public String getErrorMessage() {
        if (errorMessageNode == null || errorMessageNode.isNull()) {
            return null;
        }
        if (errorMessageNode.isTextual()) {
            String text = errorMessageNode.asText();
            return text == null || text.isBlank() ? null : text;
        }
        if (errorMessageNode.isArray()) {
            String joined = StreamSupport.stream(errorMessageNode.spliterator(), false)
                .map(JsonNode::asText)
                .filter(text -> text != null && !text.isBlank())
                .collect(Collectors.joining("; "));
            return joined.isBlank() ? null : joined;
        }
        String text = errorMessageNode.asText();
        return text == null || text.isBlank() ? null : text;
    }

    @Data
    public static class ParsedResult {
        @JsonProperty("ParsedText")
        private String parsedText;
    }
}