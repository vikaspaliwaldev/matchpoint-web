package io.matchpoint.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @Email(message = "Email must be a valid format")
    @NotBlank(message = "Email is required")
    private String email;
}
