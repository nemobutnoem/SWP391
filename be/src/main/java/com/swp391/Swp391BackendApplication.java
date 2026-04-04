package com.swp391;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Swp391BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(Swp391BackendApplication.class, args);
    }
}
