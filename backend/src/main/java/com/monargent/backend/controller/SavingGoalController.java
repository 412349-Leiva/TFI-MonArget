package com.monargent.backend.controller;

import com.monargent.backend.dto.savinggoal.SavingGoalCreateRequest;
import com.monargent.backend.dto.savinggoal.SavingGoalDepositRequest;
import com.monargent.backend.dto.savinggoal.SavingGoalResponse;
import com.monargent.backend.dto.savinggoal.SavingGoalUpdateRequest;
import com.monargent.backend.service.SavingGoalService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/saving-goals")
@RequiredArgsConstructor
public class SavingGoalController {

    private final SavingGoalService savingGoalService;

    @GetMapping
    public ResponseEntity<List<SavingGoalResponse>> findAll() {
        return ResponseEntity.ok(savingGoalService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavingGoalResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(savingGoalService.getById(id));
    }

    @PostMapping
    public ResponseEntity<SavingGoalResponse> create(@Valid @RequestBody SavingGoalCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(savingGoalService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavingGoalResponse> update(@PathVariable Long id, @Valid @RequestBody SavingGoalUpdateRequest request) {
        return ResponseEntity.ok(savingGoalService.update(id, request));
    }

    @PatchMapping("/{id}/deposit")
    public ResponseEntity<SavingGoalResponse> deposit(@PathVariable Long id, @Valid @RequestBody SavingGoalDepositRequest request) {
        return ResponseEntity.ok(savingGoalService.deposit(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        savingGoalService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
