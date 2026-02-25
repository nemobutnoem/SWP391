package com.swp391.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jira")
@Data
public class JiraProperties {
    private String baseUrl;
    private String email;
    private String apiToken;
    private Debug debug;

    @Data
    public static class Debug {
        private boolean minimalSearchPayload;
    }
}
