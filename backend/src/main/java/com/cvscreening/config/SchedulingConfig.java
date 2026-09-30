package com.cvscreening.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.Clock;

/**
 * Bat @Scheduled (OutboxRelay, LoginAttemptService) va cung cap Clock dung chung.
 * Tach khoi CvScreeningApplication de test slice (@WebMvcTest, @DataJpaTest) khong kich hoat job nen.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
