package com.monargent.backend.service.impl;

import com.monargent.backend.dto.profile.UserDocumentResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.GroupSettlementPayment;
import com.monargent.backend.entity.User;
import com.monargent.backend.repository.GroupGuestMemberRepository;
import com.monargent.backend.repository.GroupRepository;
import com.monargent.backend.repository.GroupSettlementPaymentRepository;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.ProfileDocumentService;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileDocumentServiceImpl implements ProfileDocumentService {

    private final GroupSettlementPaymentRepository settlementPaymentRepository;
    private final GroupRepository groupRepository;
    private final GroupGuestMemberRepository guestMemberRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    @Override
    public List<UserDocumentResponse> listReceivedDocuments() {
        User currentUser = currentUserService.getCurrentUser();
        String creditorKey = "user-" + currentUser.getId();

        List<GroupSettlementPayment> payments = settlementPaymentRepository
            .findAllByToMemberKeyAndProofUploadedAtIsNotNullOrderByProofUploadedAtDesc(creditorKey);

        Map<Long, Group> groupsById = groupRepository.findAllById(
            payments.stream().map(p -> p.getGroup().getId()).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Group::getId, g -> g));

        Map<Long, GroupGuestMember> guestsById = guestMemberRepository.findAll().stream()
            .collect(Collectors.toMap(GroupGuestMember::getId, g -> g, (a, b) -> a));

        Map<Long, User> usersById = userRepository.findAll().stream()
            .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return payments.stream()
            .map(payment -> {
                Group group = groupsById.get(payment.getGroup().getId());
                return UserDocumentResponse.builder()
                    .id(payment.getId())
                    .groupId(group != null ? group.getId() : null)
                    .groupTitle(group != null ? group.getTitle() : "Grupo")
                    .fromMemberKey(payment.getFromMemberKey())
                    .toMemberKey(payment.getToMemberKey())
                    .fromMemberName(resolveMemberName(payment.getFromMemberKey(), guestsById, usersById))
                    .amount(payment.getSettlementAmount())
                    .contentType(payment.getProofContentType())
                    .uploadedAt(payment.getProofUploadedAt())
                    .confirmed(payment.isConfirmed())
                    .build();
            })
            .toList();
    }

    private String resolveMemberName(
        String memberKey,
        Map<Long, GroupGuestMember> guestsById,
        Map<Long, User> usersById
    ) {
        if (memberKey == null) {
            return "Integrante";
        }
        if (memberKey.startsWith("guest-")) {
            Long guestId = Long.parseLong(memberKey.substring("guest-".length()));
            GroupGuestMember guest = guestsById.get(guestId);
            return guest != null ? guest.getDisplayName() : "Invitado";
        }
        if (memberKey.startsWith("user-")) {
            Long userId = Long.parseLong(memberKey.substring("user-".length()));
            User user = usersById.get(userId);
            if (user == null) {
                return "Integrante";
            }
            String last = user.getLastname() != null ? user.getLastname().trim() : "";
            String first = user.getName() != null ? user.getName().trim() : "";
            String full = (first + " " + last).trim();
            return full.isBlank() ? user.getEmail() : full;
        }
        return "Integrante";
    }
}
