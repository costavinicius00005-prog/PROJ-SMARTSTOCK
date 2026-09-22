package com.smartstock.iam.infrastructure.web;

public record UpdateUserRequest(Boolean active, String role, String password) {
}
