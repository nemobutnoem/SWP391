package com.swp391.integration.sync;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboundSyncLogRepository extends JpaRepository<OutboundSyncLogEntity, Integer> {
}
