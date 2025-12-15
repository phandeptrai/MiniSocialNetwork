package com.mini.socialnetwork.infras;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.mini.socialnetwork.modules.chat.entity.Message.Attachment;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Service for managing file storage operations using MinIO object storage.
 * <p>
 * Provides functionality to upload files to MinIO buckets and generate
 * presigned URLs for secure, time-limited access to stored objects.
 * Files are organized by conversation ID for better management.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.external-url}")
    private String externalUrl;

    @Value("${minio.endpoint}")
    private String endpoint;

    /**
     * Uploads a file to MinIO storage organized by conversation.
     * <p>
     * The file is stored in a folder structure: {@code conversations/{conversationId}/{fileName}}.
     * The original filename is prefixed with a UUID to ensure uniqueness.
     * </p>
     *
     * @param file the multipart file to upload
     * @param conversationId the ID of the conversation the file belongs to
     * @return an Attachment object containing file metadata and storage location
     * @throws RuntimeException if an error occurs during the upload process
     */
    public Attachment uploadFile(MultipartFile file, Long conversationId) {
        try {
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            String objectKey = "conversations/" + conversationId + "/" + fileName;

            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectKey)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build()
            );

            return Attachment.builder()
                .fileName(file.getOriginalFilename())
                .objectKey(objectKey)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .build();
        } catch (Exception e) {
            throw new RuntimeException("Upload error", e);
        }
    }

    /**
     * Generates a presigned URL for secure, temporary access to a stored object.
     * <p>
     * The presigned URL is valid for 15 minutes and allows unauthenticated
     * download access to the object without exposing the MinIO endpoint directly.
     * The endpoint is replaced with the external URL for public accessibility.
     * </p>
     *
     * @param objectKey the object key (path) in the MinIO bucket
     * @return a presigned URL with a 15-minute expiration, or null if an error occurs
     */
    public String generatePresignedUrl(String objectKey) {
        try {
            String url = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucketName)
                    .object(objectKey)
                    .expiry(15, TimeUnit.MINUTES)
                    .build()
            );
            
            return url.replace(endpoint, externalUrl);
        } catch (Exception e) {
            log.error("Error generating URL", e);
            return null;
        }
    }
}