package com.cvscreening.cv;

/** Trang thai xu ly CV trong pipeline bat dong bo. */
public enum CvStatus {
    PENDING,     // vua upload, cho worker xu ly
    PROCESSED,   // worker da phan tich va cham diem xong
    FAILED       // xu ly loi (file hong, khong doc duoc...)
}
