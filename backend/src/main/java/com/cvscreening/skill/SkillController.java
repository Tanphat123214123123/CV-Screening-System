package com.cvscreening.skill;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
@Tag(name = "Skills", description = "Tu dien ky nang AI nhan dien duoc")
public class SkillController {

    private final JdbcTemplate jdbcTemplate;

    /** skills rong = AI worker chua khoi dong lan nao (chua dong bo tu dien) -> frontend bo qua canh bao. */
    public record SkillDictionaryResponse(List<String> skills) {}

    @GetMapping
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Danh sach ky nang AI worker nhan dien duoc trong CV (de canh bao khi dang tin)")
    public SkillDictionaryResponse list() {
        // Bang do worker ghi, khong phai entity JPA -> doc thang bang SQL
        return new SkillDictionaryResponse(
                jdbcTemplate.queryForList("SELECT skill FROM skill_keywords ORDER BY skill", String.class));
    }
}
