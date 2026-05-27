package io.matchpoint;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // Enables scheduled daily pruning cleanups
public class MatchPointApplication {
    public static void main(String[] args) {
        SpringApplication.run(MatchPointApplication.class, args);
    }
}
