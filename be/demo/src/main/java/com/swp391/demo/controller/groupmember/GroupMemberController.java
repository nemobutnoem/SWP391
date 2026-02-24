package com.swp391.demo.controller.groupmember;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.swp391.demo.entity.groupmember.GroupMember;
import com.swp391.demo.service.groupmember.GroupMemberService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/groupmembers")
@RequiredArgsConstructor
public class GroupMemberController {
private final GroupMemberService groupMemberService;
@GetMapping
public ResponseEntity<List<GroupMember>> getAllLectures(){
    return ResponseEntity.ok(groupMemberService.getAllMembers());
}

@GetMapping("/id")
public ResponseEntity<GroupMember> getMemberById(@PathVariable Long id){
    return ResponseEntity.ok(groupMemberService.getMemberById(id));
}

@PostMapping
public ResponseEntity<GroupMember> createMember(@RequestBody GroupMember groupMember){
    GroupMember saved = groupMemberService.createMember(groupMember);
    return ResponseEntity.ok(saved);
}
@PutMapping("/id")
public ResponseEntity<GroupMember> updateMember(@PathVariable Long id,@RequestBody GroupMember groupMember){
    return ResponseEntity.ok(groupMemberService.updateMember(id,groupMember));
}
@DeleteMapping("/id")
public ResponseEntity<String> deleteMember(@PathVariable Long id){
    groupMemberService.deleteMember(id);;
    return ResponseEntity.ok("Member delete successfully");
}
}


