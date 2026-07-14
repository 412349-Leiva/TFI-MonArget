package com.monargent.backend.service.group;

import static org.assertj.core.api.Assertions.assertThat;

import com.monargent.backend.service.group.GroupSettlementCalculator.Participant;
import com.monargent.backend.service.group.GroupSettlementCalculator.Transfer;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class GroupSettlementCalculatorTest {

    @Test
    void compute_nullOrEmpty_returnsNoTransfers() {
        assertThat(GroupSettlementCalculator.compute(null)).isEmpty();
        assertThat(GroupSettlementCalculator.compute(List.of())).isEmpty();
    }

    @Test
    void compute_zeroTotal_returnsNoTransfers() {
        List<Participant> participants = List.of(
            participant("a", "0.00"),
            participant("b", "0.00")
        );

        assertThat(GroupSettlementCalculator.compute(participants)).isEmpty();
    }

    @Test
    void compute_twoPeopleOnePaysAll_usesHalfUpShare() {
        List<Participant> participants = List.of(
            participant("payer", "100.00"),
            participant("other", "0.00")
        );

        List<Transfer> transfers = GroupSettlementCalculator.compute(participants);

        assertThat(transfers).hasSize(1);
        Transfer transfer = transfers.getFirst();
        assertThat(transfer.getFromMemberKey()).isEqualTo("other");
        assertThat(transfer.getToMemberKey()).isEqualTo("payer");
        assertThat(transfer.getAmount()).isEqualByComparingTo("50.00");
    }

    @Test
    void compute_threePeople_minimizesTransfers() {
        List<Participant> participants = List.of(
            participant("a", "90.00"),
            participant("b", "30.00"),
            participant("c", "0.00")
        );

        List<Transfer> transfers = GroupSettlementCalculator.compute(participants);

        // total 120 → share 40 each; balances: A +50, B -10, C -40 → at most 2 transfers
        assertThat(transfers).hasSizeLessThanOrEqualTo(2);
        BigDecimal transferred = transfers.stream()
            .map(Transfer::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(transferred).isEqualByComparingTo("50.00");
        assertThat(transfers).noneMatch(t -> t.getFromMemberKey().equals(t.getToMemberKey()));
    }

    @Test
    void compute_allEqual_returnsNoTransfers() {
        List<Participant> participants = List.of(
            participant("a", "40.00"),
            participant("b", "40.00"),
            participant("c", "40.00")
        );

        assertThat(GroupSettlementCalculator.compute(participants)).isEmpty();
    }

    private static Participant participant(String key, String paid) {
        return Participant.builder()
            .memberKey(key)
            .nick(key)
            .mpAlias(key)
            .paid(new BigDecimal(paid))
            .currentUser(false)
            .build();
    }
}
