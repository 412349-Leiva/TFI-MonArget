package com.monargent.backend.dto.profile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDocumentResponse {

    private Long id;
    private Long groupId;
    private String groupTitle;
    private String fromMemberKey;
    private String toMemberKey;
    private String fromMemberName;
    private BigDecimal amount;
    private String contentType;
    private LocalDateTime uploadedAt;
    private boolean confirmed;
}
