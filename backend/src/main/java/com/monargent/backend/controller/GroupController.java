package com.monargent.backend.controller;

import com.monargent.backend.dto.group.GroupCreateRequest;
import com.monargent.backend.dto.group.GroupExpenseBatchRequest;
import com.monargent.backend.dto.group.GroupGuestCreateRequest;
import com.monargent.backend.dto.group.GroupInvitationResponse;
import com.monargent.backend.dto.group.GroupInviteRequest;
import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSettlementMarkPaidRequest;
import com.monargent.backend.dto.group.GroupSummaryResponse;
import com.monargent.backend.dto.group.SettlementProofDownload;
import com.monargent.backend.service.GroupService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public ResponseEntity<List<GroupSummaryResponse>> findAll() {
        return ResponseEntity.ok(groupService.findAllForCurrentUser());
    }

    @GetMapping("/history")
    public ResponseEntity<List<GroupSummaryResponse>> findHistory() {
        return ResponseEntity.ok(groupService.findHistoryForCurrentUser());
    }

    @GetMapping("/invitations")
    public ResponseEntity<List<GroupInvitationResponse>> pendingInvitations() {
        return ResponseEntity.ok(groupService.findPendingInvitations());
    }

    @PostMapping("/invitations/{id}/accept")
    public ResponseEntity<GroupResponse> acceptInvitation(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.acceptInvitation(id));
    }

    @PostMapping("/invitations/{id}/reject")
    public ResponseEntity<Void> rejectInvitation(@PathVariable Long id) {
        groupService.rejectInvitation(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody GroupCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.findById(id));
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<Void> invite(@PathVariable Long id, @Valid @RequestBody GroupInviteRequest request) {
        groupService.inviteMember(id, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/guests")
    public ResponseEntity<GroupResponse> addGuest(
        @PathVariable Long id,
        @Valid @RequestBody GroupGuestCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.addGuest(id, request));
    }

    @PostMapping("/{id}/my-expenses")
    public ResponseEntity<GroupResponse> addMyExpenses(
        @PathVariable Long id,
        @Valid @RequestBody GroupExpenseBatchRequest request
    ) {
        return ResponseEntity.ok(groupService.addMyExpenses(id, request));
    }

    @PostMapping(value = "/{id}/settlements/proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GroupResponse> uploadSettlementProof(
        @PathVariable Long id,
        @RequestParam String fromMemberKey,
        @RequestParam String toMemberKey,
        @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(groupService.uploadSettlementProof(id, fromMemberKey, toMemberKey, file));
    }

    @GetMapping("/{id}/settlements/proof")
    public ResponseEntity<Resource> getSettlementProof(
        @PathVariable Long id,
        @RequestParam String fromMemberKey,
        @RequestParam String toMemberKey
    ) {
        SettlementProofDownload download = groupService.getSettlementProofDownload(id, fromMemberKey, toMemberKey);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + download.getFilename() + "\"")
            .contentType(MediaType.parseMediaType(download.getContentType()))
            .body(download.getResource());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClosedGroup(@PathVariable Long id) {
        groupService.deleteClosedGroup(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/settlements/confirm")
    public ResponseEntity<GroupResponse> confirmSettlementPayment(
        @PathVariable Long id,
        @Valid @RequestBody GroupSettlementMarkPaidRequest request
    ) {
        return ResponseEntity.ok(groupService.confirmSettlementPayment(id, request));
    }

    @PostMapping("/{id}/settlements/mark-paid")
    public ResponseEntity<GroupResponse> markSettlementPaid(
        @PathVariable Long id,
        @Valid @RequestBody GroupSettlementMarkPaidRequest request
    ) {
        return ResponseEntity.ok(groupService.markSettlementPaid(id, request));
    }

    @PostMapping("/{id}/settlements/mark-cash")
    public ResponseEntity<GroupResponse> markSettlementCash(
        @PathVariable Long id,
        @Valid @RequestBody GroupSettlementMarkPaidRequest request
    ) {
        return ResponseEntity.ok(groupService.markSettlementCash(id, request));
    }

    @PostMapping("/{id}/confirm-movements")
    public ResponseEntity<GroupResponse> confirmMovements(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.confirmMovements(id));
    }
}
