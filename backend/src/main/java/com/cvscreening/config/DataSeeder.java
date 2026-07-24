package com.cvscreening.config;

import com.cvscreening.job.Job;
import com.cvscreening.job.JobRepository;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import com.cvscreening.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Seed du lieu demo: 1 tai khoan HR, 1 tai khoan ung vien, 1 tin tuyen dung mau. */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail("hr@demo.com")) return;

        User hr = userRepository.save(User.builder()
                .fullName("Nguyen Thi HR")
                .email("hr@demo.com")
                .password(passwordEncoder.encode("123456"))
                .role(Role.HR)
                .build());

        userRepository.save(User.builder()
                .fullName("Tran Van Ung Vien")
                .email("candidate@demo.com")
                .password(passwordEncoder.encode("123456"))
                .role(Role.CANDIDATE)
                .build());

        jobRepository.save(Job.builder()
                .title("Backend Developer (Java/Spring Boot)")
                .description("Tham gia phat trien he thong web quy mo lon. "
                        + "Yeu cau: toi thieu 1 nam kinh nghiem Java, hieu biet ve REST API, "
                        + "database quan he va Docker. Uu tien ung vien biet AWS.")
                .requiredSkills("Java, Spring Boot, PostgreSQL, REST API, Docker, AWS, Git")
                .location("TP. Ho Chi Minh")
                .createdBy(hr.getId())
                .build());

        log.info("Da seed du lieu demo: hr@demo.com / candidate@demo.com (mat khau: 123456)");
    }
}
