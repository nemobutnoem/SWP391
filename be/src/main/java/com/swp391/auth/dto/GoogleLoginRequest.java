package com.swp391.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public record GoogleLoginRequest(
        @JsonProperty("credential") String credential) {
    @JsonCreator
    public GoogleLoginRequest(@JsonProperty("credential") String credential) {
        this.credential = credential;
    }
}
