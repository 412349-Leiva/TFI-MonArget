package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.group.GroupSettlementMarkPaidRequest;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.GroupLifecycleStatus;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.GroupExpenseRepository;
import com.monargent.backend.repository.GroupGuestMemberRepository;
import com.monargent.backend.repository.GroupInvitationRepository;
import com.monargent.backend.repository.GroupMovementConfirmationRepository;
import com.monargent.backend.repository.GroupRepository;
import com.monargent.backend.repository.GroupSettlementPaymentRepository;
import com.monargent.backend.repository.NotificationRepository;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.GroupEmailService;
import com.monargent.backend.service.GuestSettlementTokenService;
import com.monargent.backend.service.NotificationService;
import com.monargent.backend.service.SettlementProofStorageService;
import com.monargent.backend.service.TransactionService;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GroupServiceImplTest {

    @Mock private GroupRepository groupRepository;
    @Mock private GroupExpenseRepository groupExpenseRepository;
    @Mock private GroupGuestMemberRepository groupGuestMemberRepository;
    @Mock private GroupInvitationRepository groupInvitationRepository;
    @Mock private GroupSettlementPaymentRepository settlementPaymentRepository;
    @Mock private GroupMovementConfirmationRepository movementConfirmationRepository;
    @Mock private UserRepository userRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private NotificationService notificationService;
    @Mock private GroupEmailService groupEmailService;
    @Mock private SettlementProofStorageService settlementProofStorageService;
    @Mock private CategoryRepository categoryRepository;
    @Mock private TransactionService transactionService;
    @Mock private NotificationRepository notificationRepository;
    @Mock private GuestSettlementTokenService guestSettlementTokenService;

    @InjectMocks
    private GroupServiceImpl groupService;

    @Test
    void confirmSettlementPayment_whenCurrentUserIsNotCreditor_throws() {
        User currentUser = User.builder()
            .id(1L)
            .name("Ana")
            .lastname("Perez")
            .email("ana@example.com")
            .password("secret")
            .verified(true)
            .build();
        Group group = Group.builder()
            .id(10L)
            .title("Asado")
            .lifecycleStatus(GroupLifecycleStatus.SETTLEMENT)
            .members(new HashSet<>(Set.of(currentUser)))
            .build();

        when(currentUserService.getCurrentUser()).thenReturn(currentUser);
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(groupRepository.existsByIdAndMembers_Id(10L, 1L)).thenReturn(true);
        when(groupRepository.findByIdWithMembers(10L)).thenReturn(Optional.of(group));

        GroupSettlementMarkPaidRequest request = GroupSettlementMarkPaidRequest.builder()
            .fromMemberKey("user-2")
            .toMemberKey("user-99")
            .build();

        assertThatThrownBy(() -> groupService.confirmSettlementPayment(10L, request))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Solo quien cobra puede confirmar el pago.");
    }
}
