package com.monargent.backend.service.group;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.Builder;
import lombok.Data;

public final class GroupSettlementCalculator {

    private GroupSettlementCalculator() {
    }

    @Data
    @Builder
    public static class Participant {
        private String memberKey;
        private String nick;
        private String mpAlias;
        private BigDecimal paid;
        private boolean currentUser;
    }

    @Data
    @Builder
    public static class Transfer {
        private String fromMemberKey;
        private String fromNick;
        private String fromMpAlias;
        private String toMemberKey;
        private String toNick;
        private String toMpAlias;
        private BigDecimal amount;
    }

    public static List<Transfer> compute(List<Participant> participants) {
        if (participants == null || participants.isEmpty()) {
            return List.of();
        }

        BigDecimal total = participants.stream()
            .map(Participant::getPaid)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }

        BigDecimal share = total.divide(
            BigDecimal.valueOf(participants.size()),
            2,
            RoundingMode.HALF_UP
        );

        List<MutableBalance> creditors = new ArrayList<>();
        List<MutableBalance> debtors = new ArrayList<>();

        for (Participant participant : participants) {
            BigDecimal balance = participant.getPaid().subtract(share);
            if (balance.compareTo(BigDecimal.ZERO) > 0) {
                creditors.add(MutableBalance.from(participant, balance));
            } else if (balance.compareTo(BigDecimal.ZERO) < 0) {
                debtors.add(MutableBalance.from(participant, balance.negate()));
            }
        }

        creditors.sort(Comparator.comparing(MutableBalance::getAmount).reversed());
        debtors.sort(Comparator.comparing(MutableBalance::getAmount).reversed());

        List<Transfer> transfers = new ArrayList<>();
        int ci = 0;
        int di = 0;

        while (ci < creditors.size() && di < debtors.size()) {
            MutableBalance creditor = creditors.get(ci);
            MutableBalance debtor = debtors.get(di);
            BigDecimal payment = creditor.getAmount().min(debtor.getAmount());

            if (payment.compareTo(BigDecimal.ZERO) > 0) {
                transfers.add(Transfer.builder()
                    .fromMemberKey(debtor.getMemberKey())
                    .fromNick(debtor.getNick())
                    .fromMpAlias(debtor.getMpAlias())
                    .toMemberKey(creditor.getMemberKey())
                    .toNick(creditor.getNick())
                    .toMpAlias(creditor.getMpAlias())
                    .amount(payment)
                    .build());
            }

            creditor.setAmount(creditor.getAmount().subtract(payment));
            debtor.setAmount(debtor.getAmount().subtract(payment));

            if (creditor.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                ci++;
            }
            if (debtor.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                di++;
            }
        }

        return transfers;
    }

    @Data
    private static class MutableBalance {
        private String memberKey;
        private String nick;
        private String mpAlias;
        private BigDecimal amount;

        static MutableBalance from(Participant participant, BigDecimal amount) {
            MutableBalance balance = new MutableBalance();
            balance.setMemberKey(participant.getMemberKey());
            balance.setNick(participant.getNick());
            balance.setMpAlias(participant.getMpAlias());
            balance.setAmount(amount);
            return balance;
        }
    }
}
