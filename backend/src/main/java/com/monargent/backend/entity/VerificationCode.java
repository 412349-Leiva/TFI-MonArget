package com.monargent.backend.entity;

import com.monargent.backend.enums.VerificationPurpose;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "verification_codes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 6)
    private String code;

    @Column(nullable = false)
    private boolean verified;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private VerificationPurpose purpose = VerificationPurpose.REGISTRATION;

    private LocalDateTime expiration;

    private LocalDateTime createdAt;

    @Column(length = 100)
    private String name;

    @Column(length = 100)
    private String lastname;
}
