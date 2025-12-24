package com.mini.socialnetwork.dto;

import java.util.List;

public record SliceResponse<T>(
        List<T> content,
        boolean hasNext) {

    public static <T> SliceResponse<T> of(List<T> content, boolean hasNext) {
        return new SliceResponse<>(content, hasNext);
    }
}

