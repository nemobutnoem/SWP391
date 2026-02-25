package com.swp391.sync;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboundSyncLogRepository extends JpaRepository<OutboundSyncLogEntity, Integer> {
}
