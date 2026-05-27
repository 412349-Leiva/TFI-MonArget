package com.monargent.backend.entity;

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

    private LocalDateTime expiration;

    private LocalDateTime createdAt;

    @Column(length = 100)
    private String name;

    @Column(length = 100)
    private String lastname;
    @Column(length = 50)
    private String dni;
}
