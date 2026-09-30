package com.cvscreening;

import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/** File CV mau cho test: PDF/DOCX co noi dung hop le toi thieu. */
public final class TestFiles {

    private TestFiles() {
    }

    public static byte[] pdfBytes() {
        return "%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF".getBytes(StandardCharsets.US_ASCII);
    }

    /** DOCX toi thieu: file ZIP co [Content_Types].xml va word/document.xml. */
    public static byte[] docxBytes() {
        return zip("[Content_Types].xml", "word/document.xml");
    }

    public static byte[] zip(String... entryNames) {
        try (var out = new ByteArrayOutputStream(); var zip = new ZipOutputStream(out)) {
            for (String name : entryNames) {
                zip.putNextEntry(new ZipEntry(name));
                zip.write("<xml/>".getBytes(StandardCharsets.UTF_8));
                zip.closeEntry();
            }
            zip.finish();
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public static MockMultipartFile pdf(String name) {
        return new MockMultipartFile("file", name, "application/pdf", pdfBytes());
    }

    public static MockMultipartFile docx(String name) {
        return new MockMultipartFile("file", name, "application/octet-stream", docxBytes());
    }
}
