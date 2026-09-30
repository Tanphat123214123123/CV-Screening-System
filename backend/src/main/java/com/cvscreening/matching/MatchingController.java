package com.cvscreening.matching;

import com.cvscreening.matching.MatchingDtos.CandidateMatchResponse;
import com.cvscreening.user.AppUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
@Tag(name = "Matching", description = "Kết quả AI chấm điểm CV")
public class MatchingController {

    private final MatchingService matchingService;

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "HR xem danh sách ứng viên + điểm AI của một tin tuyển dụng")
    public List<CandidateMatchResponse> getCandidatesForJob(@PathVariable Long jobId,
                                                            @AuthenticationPrincipal AppUserDetails me) {
        return matchingService.getCandidatesForJob(jobId, me.user());
    }
}
