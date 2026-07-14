package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.savinggoal.SavingGoalCreateRequest;
import com.monargent.backend.dto.savinggoal.SavingGoalDepositRequest;
import com.monargent.backend.dto.savinggoal.SavingGoalResponse;
import com.monargent.backend.dto.savinggoal.SavingGoalUpdateRequest;
import com.monargent.backend.entity.SavingGoal;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.SavingGoalStatus;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.mapper.SavingGoalMapper;
import com.monargent.backend.repository.SavingGoalRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.TransactionService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SavingGoalServiceImplTest {

    @Mock private SavingGoalRepository savingGoalRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private SavingGoalMapper savingGoalMapper;
    @Mock private TransactionService transactionService;

    @InjectMocks
    private SavingGoalServiceImpl savingGoalService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
            .id(1L)
            .name("Mon")
            .lastname("Argent")
            .email("goal@example.com")
            .password("secret")
            .verified(true)
            .build();
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
    }

    @Test
    void deposit_reachesTarget_marksCompleted() {
        SavingGoal goal = SavingGoal.builder()
            .id(8L)
            .title("Notebook")
            .targetAmount(new BigDecimal("100"))
            .currentAmount(new BigDecimal("80"))
            .status(SavingGoalStatus.ACTIVE)
            .user(user)
            .build();
        when(savingGoalRepository.findByIdAndUserId(8L, 1L)).thenReturn(Optional.of(goal));
        when(savingGoalRepository.save(any(SavingGoal.class))).thenAnswer(inv -> inv.getArgument(0));
        when(savingGoalMapper.toResponse(any(SavingGoal.class))).thenAnswer(inv -> {
            SavingGoal g = inv.getArgument(0);
            return SavingGoalResponse.builder()
                .id(g.getId())
                .status(g.getStatus())
                .currentAmount(g.getCurrentAmount())
                .targetAmount(g.getTargetAmount())
                .build();
        });

        SavingGoalResponse response = savingGoalService.deposit(
            8L,
            SavingGoalDepositRequest.builder().amount(new BigDecimal("25")).build()
        );

        assertThat(response.getStatus()).isEqualTo(SavingGoalStatus.COMPLETED);
        assertThat(response.getCurrentAmount()).isEqualByComparingTo("100");
        verify(transactionService).createFromSavingGoalDeposit(goal, new BigDecimal("25"));
    }

    @Test
    void deposit_inactiveGoal_throwsSpanishMessage() {
        SavingGoal goal = SavingGoal.builder()
            .id(9L)
            .title("Pausado")
            .targetAmount(new BigDecimal("100"))
            .currentAmount(BigDecimal.ZERO)
            .status(SavingGoalStatus.PAUSED)
            .user(user)
            .build();
        when(savingGoalRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.of(goal));

        assertThatThrownBy(() -> savingGoalService.deposit(
            9L,
            SavingGoalDepositRequest.builder().amount(new BigDecimal("10")).build()
        ))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Solo podés depositar en objetivos activos");
    }

    @Test
    void findAll_getById_create_update_delete_andPartialDeposit() {
        SavingGoal goal = SavingGoal.builder()
            .id(1L).title("Meta").targetAmount(new BigDecimal("100"))
            .currentAmount(new BigDecimal("10")).status(SavingGoalStatus.ACTIVE).user(user).build();
        when(savingGoalRepository.findAllByUserId(1L)).thenReturn(List.of(goal));
        when(savingGoalMapper.toResponse(goal)).thenReturn(SavingGoalResponse.builder().id(1L).build());
        assertThat(savingGoalService.findAll()).hasSize(1);

        when(savingGoalRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(goal));
        assertThat(savingGoalService.getById(1L).getId()).isEqualTo(1L);

        when(currentUserService.getCurrentUser()).thenReturn(user);
        SavingGoalCreateRequest create = SavingGoalCreateRequest.builder()
            .title("Nuevo").targetAmount(new BigDecimal("50")).status(SavingGoalStatus.ACTIVE).build();
        when(savingGoalMapper.toEntity(create)).thenReturn(goal);
        when(savingGoalRepository.save(goal)).thenReturn(goal);
        assertThat(savingGoalService.create(create).getId()).isEqualTo(1L);

        SavingGoalUpdateRequest update = SavingGoalUpdateRequest.builder()
            .title("Act").targetAmount(new BigDecimal("100")).status(SavingGoalStatus.ACTIVE).build();
        assertThat(savingGoalService.update(1L, update).getId()).isEqualTo(1L);
        verify(savingGoalMapper).updateEntity(goal, update);

        when(savingGoalRepository.save(any(SavingGoal.class))).thenAnswer(inv -> inv.getArgument(0));
        when(savingGoalMapper.toResponse(any(SavingGoal.class))).thenAnswer(inv -> {
            SavingGoal g = inv.getArgument(0);
            return SavingGoalResponse.builder()
                .id(g.getId()).status(g.getStatus()).currentAmount(g.getCurrentAmount()).build();
        });
        SavingGoalResponse partial = savingGoalService.deposit(1L,
            SavingGoalDepositRequest.builder().amount(new BigDecimal("5")).build());
        assertThat(partial.getStatus()).isEqualTo(SavingGoalStatus.ACTIVE);
        assertThat(partial.getCurrentAmount()).isEqualByComparingTo("15");

        savingGoalService.delete(1L);
        verify(savingGoalRepository).delete(goal);
    }
}
