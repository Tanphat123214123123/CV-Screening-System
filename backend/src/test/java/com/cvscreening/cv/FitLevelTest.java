package com.cvscreening.cv;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FitLevelTest {

    @ParameterizedTest
    @CsvSource({"100, HIGH", "70, HIGH", "69.9, MEDIUM", "40, MEDIUM", "39.9, LOW", "0, LOW"})
    void chiaNguongDungBien(double score, FitLevel expected) {
        assertEquals(expected, FitLevel.of(score));
    }

    @Test
    void chuaChamThiNull() {
        assertNull(FitLevel.of(null));
    }
}
