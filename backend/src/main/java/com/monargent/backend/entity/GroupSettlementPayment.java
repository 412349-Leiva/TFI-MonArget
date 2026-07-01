package com.monargent.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.monargent.backend.enums.SettlementPaymentMethod;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(
    name = "group_settlement_payments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "from_member_key", "to_member_key"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"group", "markedBy"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class GroupSettlementPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @JsonIgnore
    private Group group;

    @Column(name = "from_member_key", nullable = false, length = 64)
    private String fromMemberKey;

    @Column(name = "to_member_key", nullable = false, length = 64)
    private String toMemberKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marked_by_user_id", nullable = false)
    @JsonIgnore
    private User markedBy;

    @Column(name = "proof_stored_name", length = 255)
    private String proofStoredName;

    @Column(name = "proof_content_type", length = 100)
    private String proofContentType;

    @Column(name = "proof_uploaded_at")
    private LocalDateTime proofUploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by_user_id")
    @JsonIgnore
    private User confirmedBy;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "settlement_amount", precision = 19, scale = 2)
    private java.math.BigDecimal settlementAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private SettlementPaymentMethod paymentMethod;

    @Column(name = "transactions_recorded", nullable = false)
    @Builder.Default
    private boolean transactionsRecorded = false;

    @Column(name = "paid_at", nullable = false, updatable = false)
    private LocalDateTime paidAt;

    @PrePersist
    void prePersist() {
        if (paidAt == null) {
            paidAt = LocalDateTime.now();
        }
    }

    public boolean isConfirmed() {
        return confirmedAt != null;
    }

    public boolean hasProof() {
        return proofStoredName != null && !proofStoredName.isBlank();
    }

    public boolean isCashPending() {
        return paymentMethod == SettlementPaymentMethod.CASH && !isConfirmed();
    }

    public boolean isAwaitingConfirmation() {
        return !isConfirmed() && (hasProof() || isCashPending());
    }
}
