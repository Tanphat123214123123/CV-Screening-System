package com.cvscreening.matching;

import com.cvscreening.matching.MatchingDtos.CandidateMatchResponse;
import com.cvscreening.user.User;
import com.cvscreening.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
@Tag(name = "Matching", description = "Ket qua AI cham diem CV")
public class MatchingController {

    private final MatchingService matchingService;
    private final UserService userService;

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "HR xem danh sach ung vien + diem AI cua mot tin tuyen dung")
    public List<CandidateMatchResponse> getCandidatesForJob(@PathVariable Long jobId,
                                                            Authentication auth) {
        User hr = userService.getByEmail(auth.getName());
        return matchingService.getCandidatesForJob(jobId, hr);
    }
}
