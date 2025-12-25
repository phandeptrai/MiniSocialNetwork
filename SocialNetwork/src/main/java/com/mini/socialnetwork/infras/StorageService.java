package com.mini.socialnetwork.infras;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.mini.socialnetwork.modules.chat.entity.Message.Attachment;
import java.util.UUID;

/**
 * Service quản lý việc lưu trữ file trên MinIO.
 * <p>
 * Lớp này cung cấp các phương thức để upload file và tạo URL công khai
 * cho các file đính kèm trong chat. Sử dụng MinIO làm hệ thống lưu trữ
 * đối tượng tương thích S3.
 * </p>
 *
 * <h2>Cấu trúc lưu trữ:</h2>
 * <p>File được tổ chức theo cấu trúc thư mục:</p>
 * <pre>
 * {bucket}/
 *   └── conversations/
 *       └── {conversationId}/
 *           └── {uuid}_{filename}
 * </pre>
 *
 * <h2>URL công khai:</h2>
 * <p>
 * Vì bucket đã được cấu hình với policy public read, file có thể truy cập
 * trực tiếp qua URL: {externalUrl}/{bucket}/conversations/{conversationId}/{filename}
 * </p>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 * @see com.mini.socialnetwork.config.MinioConfig
 * @see io.minio.MinioClient
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    /** Client MinIO đã được cấu hình */
    private final MinioClient minioClient;

    /** Tên bucket để lưu trữ file */
    @Value("${minio.bucket-name}")
    private String bucketName;

    /** URL công khai của MinIO server để truy cập file */
    @Value("${minio.external-url}")
    private String externalUrl;

    /**
     * Upload file lên MinIO và trả về thông tin metadata.
     * <p>
     * Phương thức này thực hiện các bước:
     * <ol>
     *   <li>Tạo tên file unique bằng UUID để tránh trùng lặp</li>
     *   <li>Xây dựng object key với cấu trúc thư mục theo conversationId</li>
     *   <li>Upload file stream lên MinIO</li>
     *   <li>Tạo URL công khai để truy cập file</li>
     *   <li>Trả về entity Attachment với đầy đủ thông tin</li>
     * </ol>
     * </p>
     *
     * <h3>Xử lý tên file:</h3>
     * <p>
     * Tên file gốc được thêm prefix UUID và thay thế khoảng trắng bằng underscore
     * để đảm bảo URL-safe.
     * </p>
     *
     * @param file file cần upload (từ multipart request)
     * @param conversationId ID của cuộc hội thoại để tổ chức thư mục
     * @return entity Attachment chứa thông tin file đã upload
     * @throws RuntimeException nếu có lỗi trong quá trình upload
     */
    public Attachment uploadFile(MultipartFile file, Long conversationId) {
        try {
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename().replaceAll("\\s+", "_");
            String objectKey = "conversations/" + conversationId + "/" + fileName;

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());
            
            String publicUrl = externalUrl + "/" + bucketName + "/" + objectKey;

            return Attachment.builder()
                    .fileName(file.getOriginalFilename())
                    .objectKey(objectKey)
                    .fileUrl(publicUrl)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .build();
        } catch (Exception e) {
            log.error("Error during file upload", e);
            throw new RuntimeException("Upload error", e);
        }
    }

    /**
     * Xây dựng URL công khai cho một object key.
     * <p>
     * Phương thức này được sử dụng khi cần tạo URL cho file đã tồn tại
     * trong MinIO mà chỉ có object key. URL trả về là URL công khai
     * có thể truy cập mà không cần xác thực.
     * </p>
     *
     * @param objectKey key của object trong bucket (ví dụ: "conversations/1/abc.jpg")
     * @return URL công khai đầy đủ để truy cập file
     */
    public String getPublicUrl(String objectKey) {
        return externalUrl + "/" + bucketName + "/" + objectKey;
    }
}
