package com.swp391.auth.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public record GoogleLoginRequest(
        @JsonProperty("credential") String credential,
        @JsonProperty("account_type") String accountType) {
    @JsonCreator
    public GoogleLoginRequest(
            @JsonProperty("credential") String credential,
            @JsonProperty("account_type") String accountType) {
        this.credential = credential;
        this.accountType = accountType;
    }
}
