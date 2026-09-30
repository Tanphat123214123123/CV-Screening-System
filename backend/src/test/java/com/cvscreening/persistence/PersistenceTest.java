package com.cvscreening.persistence;

import com.cvscreening.cv.Cv;
import com.cvscreening.cv.CvRepository;
import com.cvscreening.cv.CvStatus;
import com.cvscreening.cv.ReviewStatus;
import com.cvscreening.exception.DbConstraints;
import com.cvscreening.job.Job;
import com.cvscreening.job.JobRepository;
import com.cvscreening.matching.MatchResult;
import com.cvscreening.matching.MatchResultRepository;
import com.cvscreening.outbox.OutboxMessage;
import com.cvscreening.outbox.OutboxRepository;
import com.cvscreening.user.Role;
import com.cvscreening.user.User;
import com.cvscreening.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Chay tren PostgreSQL THAT (Testcontainers) voi schema do Flyway tao — nhung thu mock khong kiem duoc:
 *  - migration V1+V2 chay duoc va entity khop schema (ddl-auto: validate, sai la context khong len)
 *  - ten constraint dung nhu code bat loi (DbConstraints)
 *  - khoa ngoai, CHECK, FOR UPDATE SKIP LOCKED, cau JPQL GROUP BY cua dashboard
 * Tu bo qua khi may khong co Docker.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers(disabledWithoutDocker = true)
@Transactional(propagation = Propagation.NOT_SUPPORTED)   // tu quan ly transaction de test dong thoi
class PersistenceTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired private JdbcTemplate jdbc;
    @Autowired private PlatformTransactionManager txManager;
    @Autowired private UserRepository userRepository;
    @Autowired private JobRepository jobRepository;
    @Autowired private CvRepository cvRepository;
    @Autowired private MatchResultRepository matchResultRepository;
    @Autowired private OutboxRepository outboxRepository;

    private TransactionTemplate tx;
    private User hr;
    private User candidate;
    private Job job;

    @BeforeEach
    void setUp() {
        tx = new TransactionTemplate(txManager);
        jdbc.execute("TRUNCATE outbox_messages, match_results, cvs, jobs, users RESTART IDENTITY CASCADE");
        hr = userRepository.save(user("hr@test.com", Role.HR));
        candidate = userRepository.save(user("c@test.com", Role.CANDIDATE));
        job = jobRepository.save(Job.builder().title("Java").description("d").requiredSkills("Java")
                .createdBy(hr.getId()).build());
    }

    @Test
    void flywayDaChayDuV1V2() {
        List<String> versions = jdbc.queryForList(
                "SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank", String.class);
        assertTrue(versions.containsAll(List.of("1", "2")), versions.toString());
    }

    @Test
    void nopTrungCv_viPhamDungConstraintCoTen() {
        cvRepository.save(cv(candidate, job));

        var ex = assertThrows(DataIntegrityViolationException.class, () -> cvRepository.save(cv(candidate, job)));

        assertTrue(DbConstraints.isViolationOf(ex, DbConstraints.UK_CVS_CANDIDATE_JOB),
                "constraint: " + DbConstraints.constraintName(ex).orElse("?"));
        assertTrue(DbConstraints.isUniqueViolation(ex));
    }

    @Test
    void emailTrung_viPhamUkUsersEmail() {
        var ex = assertThrows(DataIntegrityViolationException.class,
                () -> userRepository.saveAndFlush(user("hr@test.com", Role.HR)));

        assertTrue(DbConstraints.isViolationOf(ex, DbConstraints.UK_USERS_EMAIL));
    }

    @Test
    void emailChuaChuanHoa_biDbTuChoi() {
        assertThrows(DataIntegrityViolationException.class,
                () -> userRepository.saveAndFlush(user("Upper@Test.com", Role.CANDIDATE)));
    }

    @Test
    void khoaNgoai_cvCuaJobKhongTonTai_biTuChoi() {
        Cv orphan = cv(candidate, job);
        orphan.setJobId(9_999L);

        assertThrows(DataIntegrityViolationException.class, () -> cvRepository.saveAndFlush(orphan));
    }

    @Test
    void matchResult_jobIdPhaiKhopJobCuaCv() {
        Cv cv = cvRepository.save(cv(candidate, job));
        Job otherJob = jobRepository.save(Job.builder().title("Khac").description("d").requiredSkills("Go")
                .createdBy(hr.getId()).build());

        assertThrows(DataIntegrityViolationException.class,
                () -> matchResultRepository.saveAndFlush(result(cv, otherJob.getId(), 50.0)));
        assertDoesNotThrow(() -> matchResultRepository.saveAndFlush(result(cv, job.getId(), 50.0)));
    }

    @Test
    void diemNgoai0Den100_biTuChoi() {
        Cv cv = cvRepository.save(cv(candidate, job));

        assertThrows(DataIntegrityViolationException.class,
                () -> matchResultRepository.saveAndFlush(result(cv, job.getId(), 150.0)));
    }

    @Test
    void xoaCv_xoaLuonKetQuaCham() {
        Cv cv = cvRepository.save(cv(candidate, job));
        matchResultRepository.save(result(cv, job.getId(), 80.0));

        jdbc.update("DELETE FROM cvs WHERE id = ?", cv.getId());

        assertEquals(0, matchResultRepository.count());
    }

    @Test
    void thongKeDashboard_tinhDungBangSql() {
        User c2 = userRepository.save(user("c2@test.com", Role.CANDIDATE));
        User c3 = userRepository.save(user("c3@test.com", Role.CANDIDATE));
        Cv strong = cvRepository.save(cv(candidate, job));
        strong.setStatus(CvStatus.PROCESSED);
        strong.setReviewStatus(ReviewStatus.SHORTLISTED);
        cvRepository.save(strong);
        Cv weak = cv(c2, job);
        weak.setStatus(CvStatus.PROCESSED);
        weak = cvRepository.save(weak);
        cvRepository.save(cv(c3, job));   // PENDING, chua co diem
        matchResultRepository.save(result(strong, job.getId(), 85.0));
        matchResultRepository.save(result(weak, job.getId(), 40.0));
        Job empty = jobRepository.save(Job.builder().title("Rong").description("d").requiredSkills("x")
                .createdBy(hr.getId()).build());

        var stats = cvRepository.aggregateStatsByJob(List.of(job.getId(), empty.getId()), 70.0);

        assertEquals(1, stats.size(), "tin chua co CV khong co dong thong ke");
        var s = stats.get(0);
        assertEquals(job.getId(), s.getJobId());
        assertEquals(3L, s.getApplicantCount());
        assertEquals(1L, s.getPendingCount());
        assertEquals(1L, s.getStrongCount());
        assertEquals(1L, s.getShortlistedCount());
        assertEquals(62.5, s.getAverageScore(), 0.001);
    }

    @Test
    void deleteByJobId_chiXoaKetQuaCuaTinDo() {
        Job otherJob = jobRepository.save(Job.builder().title("Khac").description("d").requiredSkills("Go")
                .createdBy(hr.getId()).build());
        Cv a = cvRepository.save(cv(candidate, job));
        Cv b = cvRepository.save(cv(candidate, otherJob));
        matchResultRepository.save(result(a, job.getId(), 70.0));
        matchResultRepository.save(result(b, otherJob.getId(), 70.0));

        tx.executeWithoutResult(s -> matchResultRepository.deleteByJobId(job.getId()));

        assertEquals(List.of(b.getId()), matchResultRepository.findAll().stream().map(MatchResult::getCvId).toList());
    }

    @Test
    void outbox_haiInstanceCungLuc_khongLayTrungMessage() throws Exception {
        for (int i = 0; i < 4; i++) {
            outboxRepository.save(OutboxMessage.builder().aggregateId((long) i).payload("m" + i).build());
        }
        var firstLocked = new CountDownLatch(1);
        var release = new CountDownLatch(1);

        // Instance 1: khoa 2 message va giu transaction mo
        CompletableFuture<List<Long>> first = CompletableFuture.supplyAsync(() -> tx.execute(s -> {
            List<Long> ids = outboxRepository.lockUnsentBatch(2).stream().map(OutboxMessage::getId).toList();
            firstLocked.countDown();
            await(release);
            return ids;
        }));
        assertTrue(firstLocked.await(10, TimeUnit.SECONDS));

        // Instance 2: khong bi chan, lay 2 message CON LAI
        var tx2 = new TransactionTemplate(txManager);
        tx2.setTimeout(5);
        tx2.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        List<Long> second = tx2.execute(s ->
                outboxRepository.lockUnsentBatch(10).stream().map(OutboxMessage::getId).toList());
        release.countDown();

        List<Long> firstIds = first.get(10, TimeUnit.SECONDS);
        assertEquals(2, firstIds.size());
        assertEquals(2, second.size());
        assertTrue(firstIds.stream().noneMatch(second::contains), firstIds + " vs " + second);
    }

    @Test
    void outbox_xoaMessageDaGuiCu_giuMessageChuaGui() {
        var oldSent = OutboxMessage.builder().aggregateId(1L).payload("a").build();
        oldSent.setSentAt(Instant.parse("2020-01-01T00:00:00Z"));
        outboxRepository.save(oldSent);
        outboxRepository.save(OutboxMessage.builder().aggregateId(2L).payload("b").build());

        int deleted = tx.execute(s -> outboxRepository.deleteSentBefore(Instant.parse("2026-01-01T00:00:00Z")));

        assertEquals(1, deleted);
        assertEquals(1, outboxRepository.countBySentAtIsNull());
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await(10, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static User user(String email, Role role) {
        return User.builder().fullName("T").email(email).password("h").role(role).build();
    }

    private static Cv cv(User candidate, Job job) {
        return Cv.builder().fileName("cv.pdf").s3Key("cvs/" + System.nanoTime() + ".pdf")
                .candidateId(candidate.getId()).jobId(job.getId()).build();
    }

    private static MatchResult result(Cv cv, Long jobId, double score) {
        return MatchResult.builder().cvId(cv.getId()).jobId(jobId).score(score).createdAt(Instant.now()).build();
    }
}
