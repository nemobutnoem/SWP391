package com.swp391.common;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * SQL Server's UNIQUE indexes do not allow multiple NULL values by default.
 * This component runs on startup to drop those indexes and recreate them as "FILTERED" indexes
 * (WHERE column IS NOT NULL).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseIndexFixer {
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixIndexes() {
        log.info("Starting Dynamic DatabaseIndexFixer for SQL Server...");

        try {
            // Fix Users table
            fixUniqueIndexOnColumn("users", "github_username");
            fixUniqueIndexOnColumn("users", "jira_account_id");

            // Fix Student table
            fixUniqueIndexOnColumn("students", "student_code");
            fixUniqueIndexOnColumn("students", "email");

            // Fix Student_Group (table name is "groups" based on Entity)
            fixUniqueIndexOnColumn("groups", "project_id");

            log.info("DatabaseIndexFixer completed.");
        } catch (Exception e) {
            log.error("DatabaseIndexFixer error: {}", e.getMessage(), e);
        }
    }

    private void fixUniqueIndexOnColumn(String tableName, String columnName) {
        log.info("Checking unique indexes on {}({})...", tableName, columnName);
        
        // Find existing unique indexes on this specific column
        String findIndexSql = 
            "SELECT i.name AS index_name " +
            "FROM sys.indexes i " +
            "JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id " +
            "JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id " +
            "WHERE i.object_id = OBJECT_ID(?) " +
            "AND c.name = ? " +
            "AND i.is_unique = 1 " +
            "AND i.has_filter = 0"; // Only target non-filtered unique indexes

        List<Map<String, Object>> indexes = jdbcTemplate.queryForList(findIndexSql, tableName, columnName);

        for (Map<String, Object> index : indexes) {
            String indexName = (String) index.get("index_name");
            log.info("Found problematic unique index {} on {}({}). Recreating as filtered...", indexName, tableName, columnName);
            
            try {
                jdbcTemplate.execute(String.format("DROP INDEX %s ON %s", indexName, tableName));
                
                String newIndexName = indexName.startsWith("uq_") ? indexName : "uq_filtered_" + tableName + "_" + columnName;
                jdbcTemplate.execute(String.format(
                    "CREATE UNIQUE INDEX %s ON %s(%s) WHERE %s IS NOT NULL",
                    newIndexName, tableName, columnName, columnName
                ));
                log.info("Successfully recreated index {} as filtered.", newIndexName);
            } catch (Exception e) {
                log.warn("Failed to fix index {}: {}", indexName, e.getMessage());
            }
        }
    }
}
