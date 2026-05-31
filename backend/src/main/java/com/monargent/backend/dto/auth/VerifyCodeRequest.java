package com.monargent.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyCodeRequest {

    @NotBlank
    @Email
    @Size(max = 150)
    private String email;

    @NotBlank
    @Pattern(regexp = "\\d{6}")
    private String code;

    private String password;

    private String passwordConfirm;
}