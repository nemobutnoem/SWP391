package com.swp391.demo.repository;

import com.swp391.demo.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByGroupId(Long groupId);

    List<Task> findByAssignedTo(Long assignedTo);
}
