package com.mini.socialnetwork.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình MinIO - hệ thống lưu trữ đối tượng tương thích S3.
 * <p>
 * Lớp này khởi tạo kết nối đến MinIO server và cấu hình bucket cho việc
 * lưu trữ file đính kèm trong chat. MinIO được chọn vì khả năng tự host
 * và tương thích với API S3.
 * </p>
 *
 * <h2>Chức năng chính:</h2>
 * <ul>
 *   <li>Khởi tạo MinioClient với thông tin xác thực từ application.properties</li>
 *   <li>Tự động tạo bucket nếu chưa tồn tại</li>
 *   <li>Thiết lập policy public read cho bucket để file có thể truy cập qua URL công khai</li>
 * </ul>
 *
 * <h2>Cấu hình cần thiết (application.properties):</h2>
 * <pre>
 * minio.endpoint=http://localhost:9000
 * minio.access-key=minioadmin
 * minio.secret-key=minioadmin
 * minio.bucket-name=chat-attachments
 * </pre>
 *
 * @author MiniSocialNetwork Team
 * @version 1.0
 * @see io.minio.MinioClient
 * @see com.mini.socialnetwork.infras.StorageService
 */
@Slf4j
@Configuration
public class MinioConfig {

    /** URL endpoint của MinIO server */
    @Value("${minio.endpoint}")
    private String endpoint;

    /** Access key để xác thực với MinIO */
    @Value("${minio.access-key}")
    private String accessKey;

    /** Secret key để xác thực với MinIO */
    @Value("${minio.secret-key}")
    private String secretKey;

    /** Tên bucket dùng để lưu trữ file */
    @Value("${minio.bucket-name}")
    private String bucketName;

    /**
     * Tạo và cấu hình bean MinioClient.
     * <p>
     * Phương thức này thực hiện các bước sau:
     * <ol>
     *   <li>Tạo MinioClient với endpoint và credentials đã cấu hình</li>
     *   <li>Kiểm tra bucket có tồn tại không, nếu không thì tạo mới</li>
     *   <li>Áp dụng policy public read cho bucket</li>
     * </ol>
     * </p>
     *
     * @return MinioClient đã được cấu hình và sẵn sàng sử dụng
     * @throws RuntimeException nếu không thể kết nối hoặc cấu hình MinIO
     */
    @Bean
    public MinioClient minioClient() {
        MinioClient client = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();

        try {
            boolean found = client.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info("MinIO bucket '{}' created successfully.", bucketName);
            } else {
                log.info("MinIO bucket '{}' already exists.", bucketName);
            }

            String policyJson = createPublicReadPolicy(bucketName);
            client.setBucketPolicy(
                SetBucketPolicyArgs.builder()
                    .bucket(bucketName)
                    .config(policyJson)
                    .build()
            );
            log.info("Public read policy set for bucket '{}'", bucketName);

        } catch (Exception e) {
            log.error("Error during MinIO initialization", e);
            throw new RuntimeException("Could not initialize MinIO", e);
        }

        return client;
    }

    /**
     * Tạo chuỗi JSON cho policy public read của bucket.
     * <p>
     * Policy này cho phép bất kỳ ai (anonymous) có thể đọc (GetObject)
     * tất cả các object trong bucket. Điều này cần thiết để người dùng
     * có thể xem file đính kèm qua URL công khai mà không cần xác thực.
     * </p>
     *
     * <h3>Lưu ý bảo mật:</h3>
     * <p>
     * Policy này chỉ cho phép đọc, không cho phép ghi hay xóa.
     * Việc upload vẫn yêu cầu xác thực qua StorageService.
     * </p>
     *
     * @param bucketName tên bucket cần áp dụng policy
     * @return chuỗi JSON định nghĩa policy theo chuẩn AWS IAM
     */
    private String createPublicReadPolicy(String bucketName) {
        return "{"
            + "\"Version\": \"2012-10-17\","
            + "\"Statement\": ["
            + "  {"
            + "    \"Effect\": \"Allow\","
            + "    \"Principal\": {\"AWS\": [\"*\"]},"
            + "    \"Action\": [\"s3:GetObject\"],"
            + "    \"Resource\": [\"arn:aws:s3:::" + bucketName + "/*\"]"
            + "  }"
            + "]"
            + "}";
    }
}
