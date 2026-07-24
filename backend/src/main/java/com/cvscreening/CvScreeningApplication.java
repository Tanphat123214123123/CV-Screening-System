package com.cvscreening;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * He thong quan ly & tuyen dung nhan su tich hop AI sang loc CV.
 *
 * Backend chinh (Spring Boot): nhan request tu frontend, upload CV len S3,
 * day message vao SQS de AI Worker (Python) xu ly bat dong bo.
 */
@SpringBootApplication
public class CvScreeningApplication {
    public static void main(String[] args) {
        SpringApplication.run(CvScreeningApplication.class, args);
    }
}
